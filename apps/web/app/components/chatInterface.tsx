"use client"
import { useContext, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Message, MessageBubble } from "./messageBubble";
import { ChatContext } from "../providers/chatContext";
import { GiCutLemon } from "react-icons/gi";
import { LemonAnimation } from "./ui/lemonAnimation";
import { useTypeOutput } from "../hooks/useTypeOutput";
import { getMessages } from "../services/message";
import { updateChatTitle } from "../services/chat";
const BACKEND_URL = "http://localhost:3002";

export const ChatInterface = ({ chat }: { chat: string }) => {
    // const ctx = useContext(ChatContext);
    // if (!ctx) return null;
    // const { chat } = ctx;

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const outputRef = useRef("");
    const { typedOutput } = useTypeOutput(output);

    const handleClick = async () => {
        console.log(input, messages.length)
        const request = input;

        if (messages.length == 0) {
            updateChatTitle(chat, request);
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
        outputRef.current = "";
        setOutput("")
        setLoading(false);

        while (!done) {
            console.log("entered");
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            const chunk = decoder.decode(value);
            fullAssistantMessage += chunk;
            console.log('Inside loop', output);
            // setOutput((prev) => prev + chunk); // Append chunk to output
            outputRef.current += chunk;
            setOutput(outputRef.current);  // triggers typing hook smoothly
        }

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
        (async () => {
            let msgs = await getMessages(chat);
            console.log(`use effect in Chat Interface`, msgs)

            msgs = msgs.map((msg: any) => ({ 
                id: msg.id, 
                content: msg.content,
                role: msg.role.toLowerCase() 
            }))
            setMessages(msgs);
        })()
    }, [chat]);

    useEffect(() => {
        containerRef.current?.scrollTo(0, containerRef.current.scrollHeight);
    }, [messages, output]);

    return (
        <div className="flex flex-col flex-1 h-full handlee-regular selection:bg-yellow-100">
            <div className="h-12 max-w-full flex justify-between items-center px-2 bg-stone-100">
                <div className="text-black"></div>
                <button className="bg-yellow-400 text-black w-20 h-4/5 py-2 px-4 rounded-lg cursor-pointer hover:bg-amber-300">Share</button>
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
                            {/* Need Typewriter effect here */}
                            <div className="prose bg-amber-100"> 
                                <ReactMarkdown>{typedOutput}</ReactMarkdown>
                            </div>
                            <div className="flex items-center mt-1">
                                <LemonAnimation />
                            </div>
                        </div>
                    )}
                    {/* <div className="flex items-center mt-1">
                        <LemonAnimation />
                    </div> */}
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