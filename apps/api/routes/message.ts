import prisma from "@repo/db";
import { Router } from "express";
import { Role } from "../../../packages/db/generated/prisma";
import { GoogleGenAI } from "@google/genai";
import { prompt } from "../systemPrompt";
const router = Router();
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

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
    console.log(req.body);
    const { chatId, content, role } = req.body;
    // const chatId = "edccf30d-8932-4946-af60-8002fba8fb93";
    // const content = "Hi, who you are ?";
    // const role = "user";
    console.log(chatId, content, role);

    const message = await prisma.message.create({
        data: {
            chatId,
            content,
            role: role == "user" ? Role.User : Role.Assistant
        }
    });

    const response = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: content,
        config: {
            systemInstruction: prompt
        }
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of response) {
        // console.log(chunk);
        console.log(chunk.text);
        res.write(chunk.text);
    }
    // console.log(response.text);
    res.end();

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