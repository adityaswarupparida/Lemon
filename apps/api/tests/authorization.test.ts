import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import app from "../app";
import prisma from "@repo/db";

let server: ReturnType<typeof app.listen>;
const PORT = 3337;
const BASE_URL = `http://localhost:${PORT}`;

// Two test users
const userA = {
    firstName: "User",
    lastName: "A",
    email: `user-a-${Date.now()}@example.com`,
    password: "testpassword123"
};

const userB = {
    firstName: "User",
    lastName: "B",
    email: `user-b-${Date.now()}@example.com`,
    password: "testpassword123"
};

let tokenA: string;
let tokenB: string;
let userAChatId: string;

beforeAll(async () => {
    server = app.listen(PORT);

    // Create User A and get token
    const signupA = await fetch(`${BASE_URL}/api/user/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userA)
    });
    const dataA = await signupA.json();
    tokenA = dataA.token;

    // Create User B and get token
    const signupB = await fetch(`${BASE_URL}/api/user/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userB)
    });
    const dataB = await signupB.json();
    tokenB = dataB.token;

    // Create a chat owned by User A
    const chatResponse = await fetch(`${BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${tokenA}`
        },
        body: JSON.stringify({ title: "User A's Private Chat" })
    });
    const chatData = await chatResponse.json();
    userAChatId = chatData.chat;

    // Add a message to User A's chat
    await prisma.message.create({
        data: {
            chatId: userAChatId,
            content: "Secret message from User A",
            role: "User"
        }
    });
});

afterAll(async () => {
    server.close();
    // Cleanup both users
    for (const user of [userA, userB]) {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (dbUser) {
            await prisma.message.deleteMany({ where: { chat: { userId: dbUser.id } } });
            await prisma.chat.deleteMany({ where: { userId: dbUser.id } });
            await prisma.user.delete({ where: { id: dbUser.id } });
        }
    }
});

describe("Cross-User Authorization", () => {
    describe("Chat Access", () => {
        test("User B should not see User A's chats in list", async () => {
            const response = await fetch(`${BASE_URL}/api/chat`, {
                headers: { "Authorization": `Bearer ${tokenB}` }
            });

            const data = await response.json();

            expect(response.status).toBe(200);
            const foundChat = data.chats.find((c: any) => c.id === userAChatId);
            expect(foundChat).toBeUndefined();
        });

        test("User B should not be able to delete User A's chat", async () => {
            const response = await fetch(`${BASE_URL}/api/chat/${userAChatId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${tokenB}` }
            });

            expect(response.status).toBe(404);

            // Verify chat still exists
            const chat = await prisma.chat.findUnique({ where: { id: userAChatId } });
            expect(chat).not.toBeNull();
        });

        test("User B should not be able to toggle share on User A's chat", async () => {
            const response = await fetch(`${BASE_URL}/api/chat/${userAChatId}/share`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${tokenB}`
                },
                body: JSON.stringify({ shareable: false })
            });

            expect(response.status).toBe(404);
        });

        test("User B should not be able to update title of User A's chat", async () => {
            const response = await fetch(`${BASE_URL}/api/chat/${userAChatId}/update-title`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${tokenB}`
                },
                body: JSON.stringify({ input: "Hacked title" })
            });

            expect(response.status).toBe(404);
        });
    });

    describe("Message Access", () => {
        test("User B should not be able to read User A's messages", async () => {
            const response = await fetch(`${BASE_URL}/api/message/${userAChatId}`, {
                headers: { "Authorization": `Bearer ${tokenB}` }
            });

            expect(response.status).toBe(404);
        });

        test("User B should not be able to send message to User A's chat", async () => {
            const response = await fetch(`${BASE_URL}/api/message`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${tokenB}`
                },
                body: JSON.stringify({
                    chatId: userAChatId,
                    content: "Unauthorized message",
                    role: "user"
                })
            });

            expect(response.status).toBe(404);
        });
    });

    describe("Search Isolation", () => {
        test("User B should not find User A's messages in search", async () => {
            const response = await fetch(`${BASE_URL}/api/chat/search?q=Secret`, {
                headers: { "Authorization": `Bearer ${tokenB}` }
            });

            const data = await response.json();

            expect(response.status).toBe(200);
            const foundResult = data.results.find((r: any) => r.chatId === userAChatId);
            expect(foundResult).toBeUndefined();
        });

        test("User A should find their own messages in search", async () => {
            const response = await fetch(`${BASE_URL}/api/chat/search?q=Secret`, {
                headers: { "Authorization": `Bearer ${tokenA}` }
            });

            const data = await response.json();

            expect(response.status).toBe(200);
            const foundResult = data.results.find((r: any) => r.chatId === userAChatId);
            expect(foundResult).toBeDefined();
        });
    });

    describe("Invalid Token Handling", () => {
        test("should reject malformed token", async () => {
            const response = await fetch(`${BASE_URL}/api/chat`, {
                headers: { "Authorization": "Bearer invalid-token-string" }
            });

            expect(response.status).toBe(401);
        });

        test("should reject empty bearer token", async () => {
            const response = await fetch(`${BASE_URL}/api/chat`, {
                headers: { "Authorization": "Bearer " }
            });

            expect(response.status).toBe(401);
        });

        test("should reject missing Bearer prefix", async () => {
            const response = await fetch(`${BASE_URL}/api/chat`, {
                headers: { "Authorization": tokenA }
            });

            expect(response.status).toBe(401);
        });
    });
});
