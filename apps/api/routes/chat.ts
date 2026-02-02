import prisma from "@repo/db";
import { Router } from "express";
import { ChatSchema } from "../types";
import { GoogleGenAI } from "@google/genai";
const router = Router()
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

router.get("/", async (req, res) => {
    const userId = req.userId;

    if (!userId) {
        res.status(401).json({
            message: "Not Authorized"
        });
        return;
    }

    const chats = await prisma.chat.findMany({
        where: {
            userId
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    res.status(200).json({
        chats
    })
});

router.post("/", async (req, res) => {
    const userId = req.userId;

    if (!userId) {
        res.status(401).json({
            message: "Not Authorized"
        });
        return;
    }

    const parsedBody = ChatSchema.safeParse(req.body);
    if (!parsedBody.success || !parsedBody.data) {
        res.status(400).json({
            error: parsedBody.error
        })
        return
    }
    const chat = await prisma.chat.create({
        data: {
            title: parsedBody.data.title,
            userId
        }
    })
    res.status(201).json({
        chat: chat.id
    })
});

router.patch("/:id/update-title", async (req, res) => {
    const userId = req.userId;

    if (!userId) {
        res.status(401).json({
            message: "Not Authorized"
        });
        return;
    }

    const id = req.params.id;
    const { input } = req.body;

    // Verify user owns this chat
    const chat = await prisma.chat.findFirst({
        where: { id, userId }
    });

    if (!chat) {
        res.status(404).json({ message: "Chat not found" });
        return;
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: input,
            config: {
                systemInstruction: `
                You are a Message Summarizer.

                RULES:
                - You will generate a short title based on the first message a user begins a conversation with
                - Ensure it is not more than 80 characters long
                - The title should be a summary of the user's message
                - If the user has attached files, consider them in the title (e.g., "Image analysis request", "PDF document review", etc.)
                - You should NOT answer the user's message, you should only generate a summary/title
                - Do not use quotes or colons
                `
            }
        });

        await prisma.chat.update({
            where: { id },
            data: { title: response.text }
        });

        res.status(202).json({
            chat: id,
            title: response.text
        });
    } catch (error) {
        console.error("Error updating title:", error);
        res.status(500).json({ message: "Failed to update title" });
    }
});

router.patch("/:id/share", async (req, res) => {
    const userId = req.userId;

    if (!userId) {
        res.status(401).json({
            message: "Not Authorized"
        });
        return;
    }

    const id = req.params.id;
    const { shareable } = req.body;

    // Verify user owns this chat
    const chat = await prisma.chat.findFirst({
        where: { id, userId }
    });

    if (!chat) {
        res.status(404).json({ message: "Chat not found" });
        return;
    }

    await prisma.chat.update({
        where: { id },
        data: { shareable: !shareable }
    });

    res.status(202).json({
        chat: id,
        shareable: !shareable
    });
});

router.get("/search", async (req, res) => {
    const userId = req.userId;

    if (!userId) {
        res.status(401).json({ message: "Not Authorized" });
        return;
    }

    const query = req.query.q as string;
    if (!query || query.trim().length < 2) {
        res.status(400).json({ message: "Search query must be at least 2 characters" });
        return;
    }

    try {
        // Search messages containing the query in user's chats
        const messages = await prisma.message.findMany({
            where: {
                content: { contains: query, mode: "insensitive" },
                chat: { userId }
            },
            select: {
                content: true,
                chat: { select: { id: true, title: true } }
            },
            orderBy: { createdAt: "desc" },
            take: 20
        });

        // Group by chat and get first matching snippet
        const chatMap = new Map<string, { chatId: string; title: string; snippet: string }>();

        for (const msg of messages) {
            if (!chatMap.has(msg.chat.id)) {
                // Extract snippet around the match
                const lowerContent = msg.content.toLowerCase();
                const lowerQuery = query.toLowerCase();
                const matchIndex = lowerContent.indexOf(lowerQuery);
                const start = Math.max(0, matchIndex - 30);
                const end = Math.min(msg.content.length, matchIndex + query.length + 60);
                const snippet = (start > 0 ? "..." : "") +
                    msg.content.slice(start, end) +
                    (end < msg.content.length ? "..." : "");

                chatMap.set(msg.chat.id, {
                    chatId: msg.chat.id,
                    title: msg.chat.title,
                    snippet
                });
            }
        }

        res.json({ results: Array.from(chatMap.values()) });
    } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({ message: "Search failed" });
    }
});

router.delete("/:id", async (req, res) => {
    const userId = req.userId;

    if (!userId) {
        res.status(401).json({
            message: "Not Authorized"
        });
        return;
    }

    const id = req.params.id;

    // Verify user owns this chat
    const chat = await prisma.chat.findFirst({
        where: { id, userId }
    });

    if (!chat) {
        res.status(404).json({ message: "Chat not found" });
        return;
    }

    // Delete associated messages first, then the chat
    await prisma.message.deleteMany({
        where: { chatId: id }
    });

    await prisma.chat.delete({
        where: { id }
    });

    res.status(202).json({
        chat: id
    });
});

export default router;