import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import app from "../app";
import prisma from "@repo/db";
import { analyzeStreamingMetrics, type StreamingMetrics } from "./helpers";

let server: ReturnType<typeof app.listen>;
const PORT = 3336;
const BASE_URL = `http://localhost:${PORT}`;

const testUser = {
    firstName: "Streaming",
    lastName: "Eval",
    email: `streaming-eval-${Date.now()}@example.com`,
    password: "testpassword123"
};

let authToken: string;
let testChatId: string;

beforeAll(async () => {
    server = app.listen(PORT);

    // Create test user
    const signupResponse = await fetch(`${BASE_URL}/api/user/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testUser)
    });
    const data = await signupResponse.json();
    authToken = data.token;

    // Create test chat
    const chatResponse = await fetch(`${BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({ title: "Streaming Eval Chat" })
    });
    const chatData = await chatResponse.json();
    testChatId = chatData.chat;
});

afterAll(async () => {
    server.close();
    const user = await prisma.user.findUnique({ where: { email: testUser.email } });
    if (user) {
        await prisma.message.deleteMany({ where: { chat: { userId: user.id } } });
        await prisma.chat.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
    }
});

describe("Streaming Behavior Evals", () => {
    test("should receive response as stream with multiple chunks", async () => {
        const response = await fetch(`${BASE_URL}/api/message`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            },
            body: JSON.stringify({
                chatId: testChatId,
                content: "Write a short paragraph about TypeScript.",
                role: "user"
            })
        });

        expect(response.ok).toBe(true);
        expect(response.headers.get("content-type")).toContain("text/event-stream");

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        const chunks: string[] = [];
        const chunkTimes: number[] = [];
        const startTime = Date.now();
        let firstChunkTime = 0;

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunkTime = Date.now();
            if (chunks.length === 0) {
                firstChunkTime = chunkTime - startTime;
            }
            chunkTimes.push(chunkTime);
            chunks.push(decoder.decode(value));
        }

        const totalTime = Date.now() - startTime;
        const avgChunkTime = chunkTimes.length > 1
            ? (chunkTimes[chunkTimes.length - 1] - chunkTimes[0]) / (chunkTimes.length - 1)
            : 0;

        const metrics: StreamingMetrics = {
            totalChunks: chunks.length,
            totalTime,
            averageChunkTime: avgChunkTime,
            firstChunkTime
        };

        console.log("Streaming Metrics:", metrics);
        console.log("Full response:", chunks.join(""));

        // Evaluate streaming performance
        const evalResult = analyzeStreamingMetrics(metrics, 5000, 1000);
        console.log("Eval Result:", evalResult);

        // Basic assertions
        expect(chunks.length).toBeGreaterThan(1); // Should have multiple chunks
        expect(chunks.join("").length).toBeGreaterThan(50); // Should have meaningful content
    }, 30000); // 30 second timeout for LLM response

    test("should handle streaming headers correctly", async () => {
        const response = await fetch(`${BASE_URL}/api/message`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            },
            body: JSON.stringify({
                chatId: testChatId,
                content: "Say hello",
                role: "user"
            })
        });

        expect(response.headers.get("content-type")).toContain("text/event-stream");
        expect(response.headers.get("cache-control")).toBe("no-cache");
        expect(response.headers.get("connection")).toBe("keep-alive");

        // Consume the stream
        const reader = response.body!.getReader();
        while (true) {
            const { done } = await reader.read();
            if (done) break;
        }
    }, 30000);
});
