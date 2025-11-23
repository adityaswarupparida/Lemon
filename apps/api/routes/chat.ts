import prisma from "@repo/db";
import { Router } from "express";
import { ChatSchema } from "../types";
const router = Router()

router.get("/", async (req, res) => {
    const userId = req.userId;

    if (!userId) {
        res.status(409).json({
            message: "Not Authorized"
        });
        return
    }

    const chats = await prisma.chat.findMany({
        where: {
            userId
        }
    });

    res.status(200).json({
        chats
    })
});

router.post("/", async (req, res) => {
    const userId = req.userId;

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

router.patch("/:id", async (req, res) => {
    const userId = req.userId;

    if (!userId) {
        res.status(409).json({
            message: "Not Authorized"
        });
        return
    }

    const id = req.params.id
    const { title, shareable } = req.body;


    await prisma.chat.update({
        where: {
            id
        },
        data: {
            ...(title != null ? { title } : {}),
            ...(shareable != null ? { shareable } : {})   
        }
    });

    res.status(202).json({
        chat: id
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