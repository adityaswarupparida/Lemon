import prisma from "@repo/db";
import { Router } from "express";

const router = Router();

// Public endpoint - no auth required
router.get("/:id", async (req, res) => {
    const chatId = req.params.id;

    try {
        const chat = await prisma.chat.findFirst({
            where: {
                id: chatId,
                shareable: true
            },
            select: {
                id: true,
                title: true,
                createdAt: true,
                user: {
                    select: {
                        firstName: true
                    }
                }
            }
        });

        if (!chat) {
            res.status(404).json({ message: "Chat not found or not shareable" });
            return;
        }

        const messages = await prisma.message.findMany({
            where: { chatId },
            select: {
                id: true,
                content: true,
                role: true,
                createdAt: true
            },
            orderBy: { createdAt: "asc" }
        });

        res.json({
            chat: {
                id: chat.id,
                title: chat.title,
                createdAt: chat.createdAt,
                author: chat.user.firstName
            },
            messages
        });
    } catch (error) {
        console.error("Share fetch error:", error);
        res.status(500).json({ message: "Failed to fetch shared chat" });
    }
});

export default router;
