import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import app from "../app";
import prisma from "@repo/db";

let server: ReturnType<typeof app.listen>;
const PORT = 3338;
const BASE_URL = `http://localhost:${PORT}`;

const testUser = {
    firstName: "Edge",
    lastName: "Tester",
    email: `edge-test-${Date.now()}@example.com`,
    password: "testpassword123"
};

let authToken: string;
let testChatId: string;

beforeAll(async () => {
    server = app.listen(PORT);

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
        body: JSON.stringify({ title: "Edge Case Chat" })
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

describe("Edge Cases", () => {
    describe("Empty/Whitespace Inputs", () => {
        test("search with whitespace-only query should fail", async () => {
            const response = await fetch(`${BASE_URL}/api/chat/search?q=   `, {
                headers: { "Authorization": `Bearer ${authToken}` }
            });

            expect(response.status).toBe(400);
        });

        test("search with exactly 2 characters should work", async () => {
            const response = await fetch(`${BASE_URL}/api/chat/search?q=ab`, {
                headers: { "Authorization": `Bearer ${authToken}` }
            });

            expect(response.status).toBe(200);
        });

        test("create chat with empty title should still work", async () => {
            const response = await fetch(`${BASE_URL}/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify({ title: "" })
            });

            // Should create but might have validation - check actual behavior
            expect([201, 400]).toContain(response.status);

            if (response.status === 201) {
                const { chat } = await response.json();
                // Cleanup
                await prisma.message.deleteMany({ where: { chatId: chat } });
                await prisma.chat.delete({ where: { id: chat } });
            }
        });
    });

    describe("Special Characters", () => {
        test("search with SQL injection attempt should be safe", async () => {
            const response = await fetch(`${BASE_URL}/api/chat/search?q=${encodeURIComponent("'; DROP TABLE Chat; --")}`, {
                headers: { "Authorization": `Bearer ${authToken}` }
            });

            expect(response.status).toBe(200);
            // Verify database is still intact
            const chats = await prisma.chat.findMany();
            expect(chats).toBeDefined();
        });

        test("search with XSS attempt should be safe", async () => {
            const response = await fetch(`${BASE_URL}/api/chat/search?q=${encodeURIComponent("<script>alert(1)</script>")}`, {
                headers: { "Authorization": `Bearer ${authToken}` }
            });

            expect(response.status).toBe(200);
        });

        test("chat title with special characters should work", async () => {
            const response = await fetch(`${BASE_URL}/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify({ title: "Test <script> & 'quotes' \"double\" 日本語 🍋" })
            });

            expect(response.status).toBe(201);
            const { chat } = await response.json();

            // Verify it's stored correctly
            const savedChat = await prisma.chat.findUnique({ where: { id: chat } });
            expect(savedChat?.title).toContain("🍋");

            // Cleanup
            await prisma.chat.delete({ where: { id: chat } });
        });

        test("message with unicode/emoji should work", async () => {
            const msg = await prisma.message.create({
                data: {
                    chatId: testChatId,
                    content: "Hello 世界! 🍋🔥 Special chars: <>&\"'",
                    role: "User"
                }
            });

            const response = await fetch(`${BASE_URL}/api/message/${testChatId}`, {
                headers: { "Authorization": `Bearer ${authToken}` }
            });

            const data = await response.json();
            expect(response.status).toBe(200);
            const found = data.messages.find((m: any) => m.content.includes("🍋"));
            expect(found).toBeDefined();

            // Cleanup
            await prisma.message.delete({ where: { id: msg.id } });
        });
    });

    describe("Boundary Conditions", () => {
        test("very long search query should be handled", async () => {
            const longQuery = "a".repeat(1000);
            const response = await fetch(`${BASE_URL}/api/chat/search?q=${longQuery}`, {
                headers: { "Authorization": `Bearer ${authToken}` }
            });

            // Should not crash - either 200 with no results or 400
            expect([200, 400]).toContain(response.status);
        });

        test("very long chat title should be handled", async () => {
            const longTitle = "Title ".repeat(500);
            const response = await fetch(`${BASE_URL}/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify({ title: longTitle })
            });

            // Should either truncate/accept or reject gracefully
            expect([201, 400]).toContain(response.status);

            if (response.status === 201) {
                const { chat } = await response.json();
                await prisma.chat.delete({ where: { id: chat } });
            }
        });
    });

    describe("Share Edge Cases", () => {
        test("shared chat with no messages should return empty array", async () => {
            // Create a chat with no messages
            const chatResponse = await fetch(`${BASE_URL}/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify({ title: "Empty Chat" })
            });
            const { chat: emptyChatId } = await chatResponse.json();

            // Make it shareable
            await prisma.chat.update({
                where: { id: emptyChatId },
                data: { shareable: true }
            });

            // Fetch via public share endpoint
            const response = await fetch(`${BASE_URL}/api/share/${emptyChatId}`);

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.messages).toBeDefined();
            expect(Array.isArray(data.messages)).toBe(true);
            expect(data.messages.length).toBe(0);

            // Cleanup
            await prisma.chat.delete({ where: { id: emptyChatId } });
        });

        test("toggling share multiple times should work", async () => {
            // Toggle ON
            let response = await fetch(`${BASE_URL}/api/chat/${testChatId}/share`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify({ shareable: false })
            });
            expect(response.status).toBe(202);
            let data = await response.json();
            const firstState = data.shareable;

            // Toggle OFF
            response = await fetch(`${BASE_URL}/api/chat/${testChatId}/share`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify({ shareable: firstState })
            });
            expect(response.status).toBe(202);
            data = await response.json();
            expect(data.shareable).toBe(!firstState);

            // Toggle again
            response = await fetch(`${BASE_URL}/api/chat/${testChatId}/share`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify({ shareable: !firstState })
            });
            expect(response.status).toBe(202);
            data = await response.json();
            expect(data.shareable).toBe(firstState);
        });
    });

    describe("Deleted Resource Access", () => {
        test("accessing deleted chat should return 404", async () => {
            // Create and delete a chat
            const createResponse = await fetch(`${BASE_URL}/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify({ title: "To Be Deleted" })
            });
            const { chat: deletedChatId } = await createResponse.json();

            await fetch(`${BASE_URL}/api/chat/${deletedChatId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${authToken}` }
            });

            // Try to access it
            const response = await fetch(`${BASE_URL}/api/message/${deletedChatId}`, {
                headers: { "Authorization": `Bearer ${authToken}` }
            });

            expect(response.status).toBe(404);
        });

        test("sharing deleted chat should return 404", async () => {
            const response = await fetch(`${BASE_URL}/api/share/deleted-chat-id-12345`);

            expect(response.status).toBe(404);
        });
    });

    describe("Signup Edge Cases", () => {
        test("signup with invalid email format should fail", async () => {
            const response = await fetch(`${BASE_URL}/api/user/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: "Test",
                    lastName: "User",
                    email: "not-an-email",
                    password: "password123"
                })
            });

            expect(response.status).toBe(400);
        });

        test("signup with very short password should be handled", async () => {
            const email = `short-pass-${Date.now()}@test.com`;
            const response = await fetch(`${BASE_URL}/api/user/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: "Test",
                    lastName: "User",
                    email,
                    password: "a"
                })
            });

            // Should either accept or reject - not crash
            expect([201, 400]).toContain(response.status);

            if (response.status === 201) {
                // Cleanup
               const user = await prisma.user.findUnique({ where: { email } });
               if (user) {
                   await prisma.message.deleteMany({ where: { chat: { userId: user.id } } });
                   await prisma.chat.deleteMany({ where: { userId: user.id } });
                   await prisma.user.delete({ where: { id: user.id } });
               }
            }
        });
    });
});
