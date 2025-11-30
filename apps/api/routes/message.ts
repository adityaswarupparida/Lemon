import prisma from "@repo/db";
import { Router } from "express";
import { Role } from "../../../packages/db/generated/prisma";
import { GoogleGenAI } from "@google/genai";
import { prompt } from "../systemPrompt";
const router = Router();
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

router.get("/:chatid", async (req, res) => {
    const chatId = req.params.chatid;

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

    const messages = await prisma.message.findMany({
        where: {
            chatId
        },
        select: {
            content: true
        }
    });
    let contents = messages.map((msg) => msg.content);
    contents.push(content) // latest request from user

    await prisma.message.create({
        data: {
            chatId,
            content,
            role: role == "user" ? Role.User : Role.Assistant
        }
    });

    const response = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
            systemInstruction: prompt
        }
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    let answer = "";

    for await (const chunk of response) {
        // console.log(chunk);
        if (chunk.text == undefined)
            continue;
        console.log(chunk.text);
        answer += (chunk.text);
        res.write(chunk.text);
    }
    res.end();

    await prisma.message.create({
        data: {
            chatId,
            role: Role.Assistant,
            content: answer
        }
    });

    // res.status(201).json({
    //     message: message.id
    // })
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