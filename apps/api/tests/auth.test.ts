import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import app from "../app";
import prisma from "@repo/db";

let server: ReturnType<typeof app.listen>;
const PORT = 3333;
const BASE_URL = `http://localhost:${PORT}`;

// Test user data
const testUser = {
    firstName: "Test",
    lastName: "User",
    email: `test-${Date.now()}@example.com`,
    password: "testpassword123"
};

beforeAll(() => {
    server = app.listen(PORT);
});

afterAll(async () => {
    server.close();
    // Cleanup test user
    await prisma.user.deleteMany({
        where: { email: testUser.email }
    });
});

describe("Auth Routes", () => {
    describe("POST /api/user/signup", () => {
        test("should create a new user and return token", async () => {
            const response = await fetch(`${BASE_URL}/api/user/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(testUser)
            });

            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.token).toBeDefined();
            expect(typeof data.token).toBe("string");
        });

        test("should fail with duplicate email", async () => {
            const response = await fetch(`${BASE_URL}/api/user/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(testUser)
            });

            expect(response.status).toBe(409);
        });

        test("should fail with missing fields", async () => {
            const response = await fetch(`${BASE_URL}/api/user/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: "incomplete@test.com" })
            });

            expect(response.status).toBe(400);
        });
    });

    describe("POST /api/user/signin", () => {
        test("should return token for valid credentials", async () => {
            const response = await fetch(`${BASE_URL}/api/user/signin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: testUser.email,
                    password: testUser.password
                })
            });

            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.token).toBeDefined();
        });

        test("should fail with wrong password", async () => {
            const response = await fetch(`${BASE_URL}/api/user/signin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: testUser.email,
                    password: "wrongpassword"
                })
            });

            expect(response.status).toBe(401);
        });

        test("should fail with non-existent email", async () => {
            const response = await fetch(`${BASE_URL}/api/user/signin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: "nonexistent@example.com",
                    password: "password"
                })
            });

            expect(response.status).toBe(401);
        });
    });

    describe("GET /api/user/details", () => {
        test("should return user details with valid token", async () => {
            // First sign in to get token
            const signinResponse = await fetch(`${BASE_URL}/api/user/signin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: testUser.email,
                    password: testUser.password
                })
            });
            const { token } = await signinResponse.json();

            // Then get details
            const response = await fetch(`${BASE_URL}/api/user/details`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.user.email).toBe(testUser.email);
            expect(data.user.firstName).toBe(testUser.firstName);
        });

        test("should fail without token", async () => {
            const response = await fetch(`${BASE_URL}/api/user/details`);

            expect(response.status).toBe(401);
        });
    });
});
