import prisma from "@repo/db";
import { Router } from "express";
import { Role } from "../../../packages/db/generated/prisma";
const router = Router();

router.get("/", async (req, res) => {
    const { chatId } = req.body;

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
    const { chatId, content, role } = req.body;

    const message = await prisma.message.create({
        data: {
            chatId,
            content,
            role: role == "User" ? Role.User : Role.Assistant
        }
    });

    res.status(201).json({
        message: message.id
    })
});

router.put("/:id", async (req, res) => {
    const id = parseInt(req.params.id)
    const { content } = req.body

    await prisma.message.update({
        where: {
            id
        },
        data: {
            content
        }
    });

    res.status(202).json({
        message: id
    })
});

export default router;