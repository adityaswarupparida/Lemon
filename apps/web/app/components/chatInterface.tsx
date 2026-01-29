"use client"
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Message, MessageBubble } from "./messageBubble";
import { GiCutLemon } from "react-icons/gi";
import { LemonAnimation } from "./ui/lemonAnimation";
import { useTypeOutput } from "../hooks/useTypeOutput";
import { getMessages } from "../services/message";
import { updateChatTitle } from "../services/chat";
import { CiLogout } from "react-icons/ci";
import { BACKEND_URL } from "../services/config";
import { ChatItem } from "../types";

export const ChatInterface = ({ chat, setChat }: { 
    chat: ChatItem | null, 
    setChat: Dispatch<SetStateAction<ChatItem | null>> 
}) => {

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const outputRef = useRef("");
    const { typedOutput } = useTypeOutput(output);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        let token = localStorage.getItem("auth_token");
        if (token) 
            setToken(token);
    }, [])

    const handleClick = async () => {
        if (!token || !chat) return;
        const request = input;

        if (messages.length == 0) {
            await updateChatTitle(chat.id, request, token);
        }
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
        setLoading(true);


        const response = await fetch(`${BACKEND_URL}/api/message`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
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

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let fullAssistantMessage = "";
        outputRef.current = "";
        setOutput("")
        setLoading(false);

        while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            const chunk = decoder.decode(value);
            fullAssistantMessage += chunk;
            outputRef.current += chunk;
            setOutput(outputRef.current);  // triggers typing hook smoothly
        }

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
        if (!token || !chat) return;

        (async () => {
            let msgs = await getMessages(chat.id, token);

            msgs = msgs.map((msg: any) => ({ 
                id: msg.id, 
                content: msg.content,
                role: msg.role.toLowerCase() 
            }))
            setMessages(msgs);
        })()

    }, [chat, token]);

    useEffect(() => {
        containerRef.current?.scrollTo(0, containerRef.current.scrollHeight);
    }, [messages, output]);

    return (
        <div className="flex flex-col flex-1 h-full handlee-regular selection:bg-yellow-100">
            <div className="h-12 max-w-full flex justify-between items-center px-2 bg-stone-50">
                <div className="text-black"></div>
                <div className="flex items-center gap-3">
                    <CiLogout className="text-black hover:text-amber-400 text-3xl hover:cursor-pointer"
                        onClick={() => setChat(null)}
                    />
                    <button className="bg-yellow-400 text-black w-20 h-4/5 py-2 px-4 rounded-lg cursor-pointer hover:bg-amber-300">Share</button>
                </div>
            </div>
            <div className="bg-white flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-white
                    [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-amber-200 px-40 text-black" ref={containerRef}>
                    {messages.map((msg, index) => (
                        <div key={`${index}`}>
                            <MessageBubble key={msg.id} message={msg} loading={false} />
                        </div>
                    ))}

                    {loading && (
                        <div className="flex flex-col items-start mt-2">
                            <GiCutLemon
                                className={`w-12 h-12 transition-all duration-300 text-amber-300 animate-squeeze`}
                            />
                        </div>
                    )}

                    {output !== "" && (
                        <div className="flex flex-col items-start mt-2">
                            <div className="prose"> 
                                <ReactMarkdown>{typedOutput}</ReactMarkdown>
                            </div>
                            <div className="flex items-center mt-1">
                                <LemonAnimation />
                            </div>
                        </div>
                    )}
                </div>
                <div className="px-40 my-3 rounded-3xl">
                    <div className="h-14 flex items-center px-1 gap-2 bg-stone-100 rounded-3xl">
                        <input type="text" placeholder="Ask anything" className="bg-white h-4/5 py-1 px-3 flex-1 text-black text-lg rounded-3xl focus:outline-amber-300 focus:outline-solid"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleClick()}
                        ></input>
                        <button className="bg-yellow-400 text-black w-20 h-4/5 py-2 px-4 rounded-3xl cursor-pointer hover:bg-amber-300"
                            onClick={handleClick}>Send</button>
                    </div>
                </div>
            </div>
        </div>
    );
}