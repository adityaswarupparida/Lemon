"use client"
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Message, MessageBubble } from "./messageBubble";
import { GiCutLemon } from "react-icons/gi";
import { LemonAnimation } from "./ui/lemonAnimation";
import { useStreamingText } from "../hooks/useStreamingText";
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
    const [loading, setLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingComplete, setStreamingComplete] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const fullMessageRef = useRef("");
    const [token, setToken] = useState<string | null>(null);
    const { displayedText, addChunk, reset } = useStreamingText(6);

    useEffect(() => {
        let token = localStorage.getItem("auth_token");
        if (token) 
            setToken(token);
    }, [])

    const handleClick = async () => {
        const request = input.trim();
        if (!token || !chat || !request || isStreaming) return;

        if (messages.length === 0) {
            updateChatTitle(chat.id, request, token);
        }
        // Add user message
        setMessages((prev) => [
            ...prev,
            {
                content: request,
                role: "user",
                id: (prev[prev.length - 1]?.id ?? -1) + 1
            }
        ]);
        setInput("");
        setLoading(true);
        setIsStreaming(true);

        try {
            const response = await fetch(`${BACKEND_URL}/api/message`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    chatId: chat.id,
                    content: request,
                    role: "user"
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            if (!response.body) {
                throw new Error('No response body');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            fullMessageRef.current = "";
            setStreamingComplete(false);
            reset();
            setLoading(false);

            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;
                if (value) {
                    const chunk = decoder.decode(value, { stream: !readerDone });
                    fullMessageRef.current += chunk;
                    addChunk(chunk);
                }
            }

            // Mark streaming as complete - the effect will handle adding to messages
            setStreamingComplete(true);
        } catch (error) {
            console.error('Failed to send message:', error);
            setLoading(false);
            reset();
            setIsStreaming(false);
        }
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

    // When typing catches up to the full message, add to messages
    useEffect(() => {
        if (streamingComplete && displayedText.length >= fullMessageRef.current.length && fullMessageRef.current.length > 0) {
            setMessages((prev) => [
                ...prev,
                {
                    content: fullMessageRef.current,
                    role: "assistant",
                    id: (prev[prev.length - 1]?.id ?? 0) + 1
                }
            ]);
            reset();
            setStreamingComplete(false);
            setIsStreaming(false);
        }
    }, [streamingComplete, displayedText, reset]);

    useEffect(() => {
        containerRef.current?.scrollTo(0, containerRef.current.scrollHeight);
    }, [messages, displayedText]);

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

                    {displayedText !== "" && (
                        <div className="flex flex-col items-start mt-2">
                            <div className="prose">
                                <ReactMarkdown>{displayedText}</ReactMarkdown>
                            </div>
                            <div className="flex items-center mt-1">
                                <LemonAnimation />
                            </div>
                        </div>
                    )}
                </div>
                <div className="px-40 my-3 rounded-3xl">
                    <div className="h-14 flex items-center px-1 gap-2 bg-stone-100 rounded-3xl">
                        <input
                            type="text"
                            placeholder="Ask anything"
                            className="bg-white h-4/5 py-1 px-3 flex-1 text-black text-lg rounded-3xl focus:outline-amber-300 focus:outline-solid disabled:opacity-50"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !isStreaming && handleClick()}
                            disabled={isStreaming}
                        />
                        <button
                            className="bg-yellow-400 text-black w-20 h-4/5 py-2 px-4 rounded-3xl cursor-pointer hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleClick}
                            disabled={isStreaming || !input.trim()}
                        >
                            {isStreaming ? "..." : "Send"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}