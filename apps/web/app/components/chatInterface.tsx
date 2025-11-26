"use client"
import { useContext, useEffect, useRef, useState } from "react";
import { Message, MessageBubble } from "./messageBubble";
import { ChatContext } from "../providers/chatContext";
const BACKEND_URL = "http://localhost:3002";

export const ChatInterface = () => {
    const ctx = useContext(ChatContext);
    if (!ctx) return null;
    const { chat } = ctx;

    const [messages, setMessages] = useState<Message[]>([
        { content: "Hello. who are you?", role: "user", id: 1},
        { content: "I'm Lemon, an AI assistant created by Lemonista. It's a pleasure to meet you!", role: "assistant", id: 2},
        { content: "Hello. who are you?", role: "user", id: 3},
        { content: "I'm Lemon, an AI assistant created by Lemonista. It's a pleasure to meet you!", role: "assistant", id: 4},
    ]);
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const containerRef = useRef<HTMLDivElement | null>(null);

    const handleClick = async () => {
        console.log(input)
        const request = input;
        // Add user message
        setMessages((prev) => [
            ...prev,
            { 
                content: request, 
                role: "user", 
                id: prev.length === 0 ? 0: prev[prev.length - 1]?.id ?? 0 + 1
            }
        ]);
        setInput("");


        const response = await fetch(`${BACKEND_URL}/api/message`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                chatId: chat,
                content: request,
                role: "user"
            }),
        }); // Connect to the backend API

        if (!response.body) {
            console.error('No response body');
            return;
        }

        // inputRef.current = '';

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let fullAssistantMessage = "";
        setOutput("")

        while (!done) {
            console.log("entered");
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            const chunk = decoder.decode(value);
            fullAssistantMessage += chunk;
            console.log('Inside loop', output);
            setOutput((prev) => prev + chunk); // Append chunk to output
        }
        // console.log('Not reaching here')
        console.log('fullAssistantMessage' + fullAssistantMessage);
        setMessages((prev) => [
            ...prev,
            { 
                content: fullAssistantMessage, 
                role: "assistant", 
                id: prev.length === 0 ? 1: prev[prev.length - 1]?.id ?? 0 + 1 
            }
        ]);

        setOutput("")
    }

    useEffect(() => {
        containerRef.current?.scrollTo(0, containerRef.current.scrollHeight);
    }, [messages, output]);

    return (
        <div className="flex flex-col flex-1 h-full handlee-regular selection:bg-yellow-100">
            <div className="h-12 max-w-full flex justify-between items-center px-2 bg-stone-100">
                <div className="text-black"></div>
                <button className="bg-yellow-400 text-black w-20 h-4/5 py-2 px-4 rounded-lg cursor-pointer hover:bg-amber-300">Share</button>
            </div>
            <div className="bg-white flex flex-col flex-1 px-40 overflow-hidden">
                <div className="flex-1 overflow-y-auto text-black" ref={containerRef}>
                    {messages.map((msg, index) => (
                        <div key={`${index}`}>
                            <MessageBubble key={msg.id} message={msg} loading={false} />
                        </div>
                    ))}

                    {output !== "" && (
                        <div className="flex justify-start mt-2 bg-amber-100">
                            {output}
                        </div>
                    )}
                </div>
                <div className="h-14 flex items-center gap-2 mb-2 px-1 bg-stone-100 rounded-3xl">
                    <input type="text" placeholder="Ask anything" className="bg-white h-4/5 py-2 px-3 flex-1 text-black text-lg rounded-3xl focus:outline-amber-300 focus:outline-solid"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    ></input>
                    <button className="bg-yellow-400 text-black w-20 h-4/5 py-2 px-4 rounded-3xl cursor-pointer hover:bg-amber-300"
                        onClick={handleClick}>Send</button>
                </div>
            </div>
        </div>
    );
}