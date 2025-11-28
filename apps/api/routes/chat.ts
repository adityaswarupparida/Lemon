import prisma from "@repo/db";
import { Router } from "express";
import { ChatSchema } from "../types";
import { GoogleGenAI } from "@google/genai";
const router = Router()
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

router.get("/", async (req, res) => {
    const userId = req.userId ?? "1edf9732-5ab3-450b-9b54-0357a072f77b";

    if (!userId) {
        res.status(409).json({
            message: "Not Authorized"
        });
        return
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
    const userId = req.userId ?? "1edf9732-5ab3-450b-9b54-0357a072f77b";

    if (!userId) {
        res.status(409).json({
            message: "Not Authorized"
        });
        return
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
    const userId = req.userId ?? "1edf9732-5ab3-450b-9b54-0357a072f77b";

    if (!userId) {
        res.status(409).json({
            message: "Not Authorized"
        });
        return
    }

    const id = req.params.id
    const { input } = req.body

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
    console.log(response.text)

    await prisma.chat.update({
        where: {
            id
        },
        data: {
            title: response.text,
        }
    });

    res.status(202).json({
        chat: id,
        title: response.text,
    })
});

router.patch("/:id/share", async (req, res) => {
    const userId = req.userId;

    if (!userId) {
        res.status(409).json({
            message: "Not Authorized"
        });
        return
    }

    const id = req.params.id
    const { shareable } = req.body;

    await prisma.chat.update({
        where: {
            id
        },
        data: {
            shareable : !shareable   
        }
    });

    res.status(202).json({
        chat: id,
        shareable: !shareable
    })
});

router.delete("/:id", async (req, res) => {
    const userId = req.userId;

    if (!userId) {
        res.status(409).json({
            message: "Not Authorized"
        });
        return
    }

    const id = req.params.id

    await prisma.chat.delete({
        where: {
            id
        }
    });

    res.status(202).json({
        chat: id
    })
});

export default router;