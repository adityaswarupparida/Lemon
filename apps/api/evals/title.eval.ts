import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import app from "../app";
import prisma from "@repo/db";
import { llmJudge, checkLength, checkContains } from "./helpers";

let server: ReturnType<typeof app.listen>;
const PORT = 3337;
const BASE_URL = `http://localhost:${PORT}`;

const testUser = {
    firstName: "Title",
    lastName: "Eval",
    email: `title-eval-${Date.now()}@example.com`,
    password: "testpassword123"
};

let authToken: string;

beforeAll(async () => {
    server = app.listen(PORT);

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
    const user = await prisma.user.findUnique({ where: { email: testUser.email } });
    if (user) {
        await prisma.message.deleteMany({ where: { chat: { userId: user.id } } });
        await prisma.chat.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
    }
});

// Test cases: [input message, expected characteristics]
const titleTestCases = [
    {
        input: "Can you help me write a Python script to sort a list of numbers?",
        expectContains: [], // flexible
        expectNotContains: [":", '"'], // no colons or quotes per system prompt
        description: "Programming help request"
    },
    {
        input: "What's the capital of France and tell me about its history?",
        expectContains: [],
        expectNotContains: [":", '"'],
        description: "Geography/history question"
    },
    {
        input: "I'm feeling stressed about my job interview tomorrow. Any tips?",
        expectContains: [],
        expectNotContains: [":", '"'],
        description: "Personal advice request"
    },
    {
        input: "Explain quantum computing to me like I'm 5 years old",
        expectContains: [],
        expectNotContains: [":", '"'],
        description: "ELI5 explanation request"
    }
];

describe("Title Generation Evals", () => {
    for (const testCase of titleTestCases) {
        test(`should generate good title for: ${testCase.description}`, async () => {
            // Create a new chat
            const chatResponse = await fetch(`${BASE_URL}/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify({ title: "Untitled" })
            });
            const { chat: chatId } = await chatResponse.json();

            // Update title with the test input
            const titleResponse = await fetch(`${BASE_URL}/api/chat/${chatId}/update-title`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify({ input: testCase.input })
            });

            const { title } = await titleResponse.json();
            console.log(`\nInput: "${testCase.input}"`);
            console.log(`Generated Title: "${title}"`);

            // Eval 1: Length check (max 80 chars per system prompt)
            const lengthEval = checkLength(title, 5, 80);
            console.log("Length Eval:", lengthEval);
            expect(lengthEval.passed).toBe(true);

            // Eval 2: Content check (no colons or quotes)
            const contentEval = checkContains(title, testCase.expectContains, testCase.expectNotContains);
            console.log("Content Eval:", contentEval);
            expect(contentEval.passed).toBe(true);

            // Eval 3: LLM-as-judge for relevance
            const relevanceEval = await llmJudge(
                "The title should be a concise, relevant summary of the user's message. It should capture the main topic or intent without being too generic.",
                testCase.input,
                title
            );
            console.log("Relevance Eval:", relevanceEval);
            expect(relevanceEval.score).toBeGreaterThanOrEqual(6);

        }, 30000);
    }

    test("should not answer the question in the title", async () => {
        const chatResponse = await fetch(`${BASE_URL}/api/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            },
            body: JSON.stringify({ title: "Untitled" })
        });
        const { chat: chatId } = await chatResponse.json();

        const input = "What is 2 + 2?";
        const titleResponse = await fetch(`${BASE_URL}/api/chat/${chatId}/update-title`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            },
            body: JSON.stringify({ input })
        });

        const { title } = await titleResponse.json();
        console.log(`\nInput: "${input}"`);
        console.log(`Generated Title: "${title}"`);

        // Title should NOT contain the answer "4"
        const notAnswerEval = await llmJudge(
            "The title should summarize the question, NOT answer it. It should not contain the answer '4' or any calculation result.",
            input,
            title
        );
        console.log("Not-Answer Eval:", notAnswerEval);
        expect(notAnswerEval.score).toBeGreaterThanOrEqual(6);
    }, 30000);
});
