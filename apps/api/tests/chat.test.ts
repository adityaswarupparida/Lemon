import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import app from "../app";
import prisma from "@repo/db";

let server: ReturnType<typeof app.listen>;
const PORT = 3334;
const BASE_URL = `http://localhost:${PORT}`;

// Test user data
const testUser = {
    firstName: "Chat",
    lastName: "Tester",
    email: `chat-test-${Date.now()}@example.com`,
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
});

afterAll(async () => {
    server.close();
    // Cleanup: delete test chats and user
    const user = await prisma.user.findUnique({ where: { email: testUser.email } });
    if (user) {
        await prisma.message.deleteMany({ where: { chat: { userId: user.id } } });
        await prisma.chat.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
    }
});

describe("Chat Routes", () => {
    describe("POST /api/chat", () => {
        test("should create a new chat", async () => {
            const response = await fetch(`${BASE_URL}/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify({ title: "Test Chat" })
            });

            const data = await response.json();
            testChatId = data.chat;

            expect(response.status).toBe(201);
            expect(data.chat).toBeDefined();
        });

        test("should fail without auth", async () => {
            const response = await fetch(`${BASE_URL}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: "Test Chat" })
            });

            expect(response.status).toBe(401);
        });
    });

    describe("GET /api/chat", () => {
        test("should return user chats", async () => {
            const response = await fetch(`${BASE_URL}/api/chat`, {
                headers: { "Authorization": `Bearer ${authToken}` }
            });

            const data = await response.json();

            expect(response.status).toBe(200);
            expect(Array.isArray(data.chats)).toBe(true);
            expect(data.chats.length).toBeGreaterThan(0);
        });

        test("should fail without auth", async () => {
            const response = await fetch(`${BASE_URL}/api/chat`);

            expect(response.status).toBe(401);
        });
    });

    describe("PATCH /api/chat/:id/share", () => {
        test("should toggle shareable status", async () => {
            const response = await fetch(`${BASE_URL}/api/chat/${testChatId}/share`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify({ shareable: false })
            });

            const data = await response.json();

            expect(response.status).toBe(202);
            expect(data.shareable).toBe(true);
        });

        test("should fail for non-existent chat", async () => {
            const response = await fetch(`${BASE_URL}/api/chat/non-existent-id/share`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify({ shareable: false })
            });

            expect(response.status).toBe(404);
        });
    });

    describe("DELETE /api/chat/:id", () => {
        test("should delete chat and its messages", async () => {
            // Create a chat to delete
            const createResponse = await fetch(`${BASE_URL}/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify({ title: "Chat to Delete" })
            });
            const { chat: chatToDelete } = await createResponse.json();

            // Delete it
            const response = await fetch(`${BASE_URL}/api/chat/${chatToDelete}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${authToken}` }
            });

            expect(response.status).toBe(202);

            // Verify it's deleted
            const chatsResponse = await fetch(`${BASE_URL}/api/chat`, {
                headers: { "Authorization": `Bearer ${authToken}` }
            });
            const { chats } = await chatsResponse.json();
            const found = chats.find((c: any) => c.id === chatToDelete);
            expect(found).toBeUndefined();
        });

        test("should fail for non-existent chat", async () => {
            const response = await fetch(`${BASE_URL}/api/chat/non-existent-id`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${authToken}` }
            });

            expect(response.status).toBe(404);
        });
    });
});
