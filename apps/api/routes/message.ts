import prisma from "@repo/db";
import { Router } from "express";
import { Role } from "../../../packages/db/generated/prisma";
import { GoogleGenAI } from "@google/genai";
import { prompt } from "../systemPrompt";
const router = Router();
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

router.get("/:chatid", async (req, res) => {
    const userId = req.userId;
    const chatId = req.params.chatid;

    // Verify user owns this chat
    const chat = await prisma.chat.findFirst({
        where: {
            id: chatId,
            userId
        }
    });

    if (!chat) {
        res.status(404).json({ error: "Chat not found" });
        return;
    }

    const messages = await prisma.message.findMany({
        where: {
            chatId
        }
    });

    res.status(200).json({
        messages
    });
});

router.post("/", async (req, res) => {
    const userId = req.userId;
    const { chatId, content, role } = req.body;

    if (!chatId || !content) {
        res.status(400).json({ error: "chatId and content are required" });
        return;
    }

    // Verify user owns this chat
    const chat = await prisma.chat.findFirst({
        where: {
            id: chatId,
            userId
        }
    });

    if (!chat) {
        res.status(404).json({ error: "Chat not found" });
        return;
    }

    try {
        const messages = await prisma.message.findMany({
            where: {
                chatId
            },
            select: {
                content: true,
                role: true
            }
        });

        // Build conversation history with proper role formatting
        const contents = messages.map((msg) => ({
            role: msg.role === Role.User ? "user" : "model",
            parts: [{ text: msg.content }]
        }));
        contents.push({
            role: "user",
            parts: [{ text: content }]
        });

        await prisma.message.create({
            data: {
                chatId,
                content,
                role: role === "user" ? Role.User : Role.Assistant
            }
        });

        const response = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: contents,
            config: {
                systemInstruction: prompt,
                tools: [
                    { googleSearch: {} }
                ],
            }
        });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();

        let answer = "";

        for await (const chunk of response) {
            if (chunk.text === undefined) continue;
            answer += chunk.text;
            // Write and flush immediately
            res.write(chunk.text);
            if (typeof (res as any).flush === 'function') {
                (res as any).flush();
            }
        }
        res.end();

        await prisma.message.create({
            data: {
                chatId,
                role: Role.Assistant,
                content: answer
            }
        });
    } catch (error: any) {
        console.error("Error in message streaming:", error);

        // Determine error type and message
        let errorType = "unknown";
        let errorMessage = "Something went wrong. Please try again.";

        if (error?.message?.includes("quota") || error?.status === 429) {
            errorType = "quota_exceeded";
            errorMessage = "API quota exceeded. Please try again later.";
        } else if (error?.message?.includes("rate") || error?.code === "RATE_LIMIT_EXCEEDED") {
            errorType = "rate_limit";
            errorMessage = "Too many requests. Please wait a moment and try again.";
        } else if (error?.message?.includes("network") || error?.code === "ECONNREFUSED") {
            errorType = "network";
            errorMessage = "Network error. Please check your connection.";
        } else if (error?.message?.includes("timeout")) {
            errorType = "timeout";
            errorMessage = "Request timed out. Please try again.";
        }

        if (!res.headersSent) {
            res.status(500).json({ error: errorMessage, type: errorType });
        } else {
            // Send error through stream
            res.write(`\n[ERROR]${JSON.stringify({ type: errorType, message: errorMessage })}`);
            res.end();
        }
    }
});

router.put("/:id", async (req, res) => {
    const userId = req.userId;
    const id = parseInt(req.params.id);
    const { content } = req.body;

    // Verify user owns the chat this message belongs to
    const message = await prisma.message.findUnique({
        where: { id },
        include: { chat: true }
    });

    if (!message || message.chat.userId !== userId) {
        res.status(404).json({ error: "Message not found" });
        return;
    }

    await prisma.message.update({
        where: { id },
        data: { content }
    });

    res.status(202).json({
        message: id
    });
});

export default router;