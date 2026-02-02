import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import app from "../app";
import prisma from "@repo/db";

let server: ReturnType<typeof app.listen>;
const PORT = 3336;
const BASE_URL = `http://localhost:${PORT}`;

// Test user data
const testUser = {
    firstName: "Share",
    lastName: "Tester",
    email: `share-test-${Date.now()}@example.com`,
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
        body: JSON.stringify({ title: "Shared Test Chat" })
    });
    const chatData = await chatResponse.json();
    testChatId = chatData.chat;

    // Add a message to the chat for testing
    await prisma.message.create({
        data: {
            chatId: testChatId,
            content: "Test message content",
            role: "User"
        }
    });
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

describe("Share Routes", () => {
    describe("GET /api/share/:id", () => {
        test("should return 404 for non-shareable chat", async () => {
            // Chat is not shareable by default
            const response = await fetch(`${BASE_URL}/api/share/${testChatId}`);

            expect(response.status).toBe(404);
            const data = await response.json();
            expect(data.message).toBe("Chat not found or not shareable");
        });

        test("should return chat and messages for shareable chat", async () => {
            // First make the chat shareable
            await fetch(`${BASE_URL}/api/chat/${testChatId}/share`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify({ shareable: false })
            });

            // Now fetch the shared chat (no auth required)
            const response = await fetch(`${BASE_URL}/api/share/${testChatId}`);

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.chat).toBeDefined();
            expect(data.chat.id).toBe(testChatId);
            expect(data.chat.title).toBe("Shared Test Chat");
            expect(data.chat.author).toBe(testUser.firstName);
            expect(data.messages).toBeDefined();
            expect(Array.isArray(data.messages)).toBe(true);
        });

        test("should return 404 for non-existent chat", async () => {
            const response = await fetch(`${BASE_URL}/api/share/non-existent-id`);

            expect(response.status).toBe(404);
        });

        test("should not require authentication", async () => {
            // Make sure chat is shareable
            await prisma.chat.update({
                where: { id: testChatId },
                data: { shareable: true }
            });

            // Fetch without any auth header
            const response = await fetch(`${BASE_URL}/api/share/${testChatId}`);

            expect(response.status).toBe(200);
        });

        test("should return 404 after chat is made private", async () => {
            // Make chat private
            await prisma.chat.update({
                where: { id: testChatId },
                data: { shareable: false }
            });

            const response = await fetch(`${BASE_URL}/api/share/${testChatId}`);

            expect(response.status).toBe(404);
        });
    });
});
