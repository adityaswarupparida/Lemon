import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import app from "../app";
import prisma from "@repo/db";

let server: ReturnType<typeof app.listen>;
const PORT = 3335;
const BASE_URL = `http://localhost:${PORT}`;

// Test user data
const testUser = {
    firstName: "Message",
    lastName: "Tester",
    email: `message-test-${Date.now()}@example.com`,
    password: "testpassword123"
};

let authToken: string;
let testChatId: string;

beforeAll(async () => {
    server = app.listen(PORT);

    // Create test user and get token
    const signupResponse = await fetch(`${BASE_URL}/api/user/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testUser)
    });
    const data = await signupResponse.json();
    authToken = data.token;

    // Create a test chat
    const chatResponse = await fetch(`${BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({ title: "Test Chat for Messages" })
    });
    const chatData = await chatResponse.json();
    testChatId = chatData.chat;
});

afterAll(async () => {
    server.close();
    // Cleanup
    const user = await prisma.user.findUnique({ where: { email: testUser.email } });
    if (user) {
        await prisma.message.deleteMany({ where: { chat: { userId: user.id } } });
        await prisma.chat.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
    }
});

describe("Message Routes", () => {
    describe("GET /api/message/:chatId", () => {
        test("should return empty messages for new chat", async () => {
            const response = await fetch(`${BASE_URL}/api/message/${testChatId}`, {
                headers: { "Authorization": `Bearer ${authToken}` }
            });

            const data = await response.json();

            expect(response.status).toBe(200);
            expect(Array.isArray(data.messages)).toBe(true);
        });

        test("should fail for non-existent chat", async () => {
            const response = await fetch(`${BASE_URL}/api/message/non-existent-id`, {
                headers: { "Authorization": `Bearer ${authToken}` }
            });

            expect(response.status).toBe(404);
        });

        test("should fail without auth", async () => {
            const response = await fetch(`${BASE_URL}/api/message/${testChatId}`);

            expect(response.status).toBe(401);
        });
    });

    describe("POST /api/message", () => {
        test("should fail with missing chatId", async () => {
            const response = await fetch(`${BASE_URL}/api/message`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    content: "Hello",
                    role: "user"
                })
            });

            expect(response.status).toBe(400);
        });

        test("should fail with missing content", async () => {
            const response = await fetch(`${BASE_URL}/api/message`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    chatId: testChatId,
                    role: "user"
                })
            });

            expect(response.status).toBe(400);
        });

        test("should fail for non-existent chat", async () => {
            const response = await fetch(`${BASE_URL}/api/message`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    chatId: "non-existent-id",
                    content: "Hello",
                    role: "user"
                })
            });

            expect(response.status).toBe(404);
        });

        test("should fail without auth", async () => {
            const response = await fetch(`${BASE_URL}/api/message`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chatId: testChatId,
                    content: "Hello",
                    role: "user"
                })
            });

            expect(response.status).toBe(401);
        });

        // Note: Full message POST test requires mocking Gemini API
        // or using a test environment with API keys
    });
});
