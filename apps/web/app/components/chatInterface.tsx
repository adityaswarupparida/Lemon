"use client"
import { useContext, useEffect, useRef, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Message, MessageBubble } from "./messageBubble";
import { GiCutLemon } from "react-icons/gi";
import { LemonAnimation } from "./ui/lemonAnimation";
import { useStreamingText } from "../hooks/useStreamingText";
import { getMessages } from "../services/message";
import { updateChatTitle } from "../services/chat";
import { IoCopyOutline, IoRefresh } from "react-icons/io5";
import { BACKEND_URL, getAuthTokenKey } from "../services/config";
import { ChatItem } from "../types";
import { ChatContext } from "../providers/chatContext";
import { ShareModal } from "./ui/shareModal";

export const ChatInterface = ({ chat }: { chat: ChatItem | null }) => {
    const context = useContext(ChatContext);
    const { updateChatTitleInList, setStreamingTitle } = context!;

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingComplete, setStreamingComplete] = useState(false);
    const [error, setError] = useState<{ message: string; type: string } | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const fullMessageRef = useRef("");
    const lastRequestRef = useRef<string>("");
    const [token, setToken] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const { displayedText, addChunk, reset } = useStreamingText(6);

    const getLastAssistantMessage = useCallback(() => {
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i]?.role === "assistant") return messages[i];
        }
        return null;
    }, [messages]);

    const handleCopy = async () => {
        const lastAssistant = getLastAssistantMessage();
        if (!lastAssistant) return;
        await navigator.clipboard.writeText(lastAssistant.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRegenerate = async () => {
        if (isStreaming || messages.length < 2) return;
        // Find last user message
        let lastUserMsg = "";
        for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i];
            if (msg?.role === "user") {
                lastUserMsg = msg.content;
                break;
            }
        }
        if (!lastUserMsg) return;
        // Remove last assistant message
        setMessages(prev => {
            const newMsgs = [...prev];
            if (newMsgs[newMsgs.length - 1]?.role === "assistant") {
                newMsgs.pop();
            }
            return newMsgs;
        });
        await sendMessage(lastUserMsg, true);
    };

    useEffect(() => {
        let token = localStorage.getItem(getAuthTokenKey());
        if (token)
            setToken(token);
    }, [])

    const sendMessage = async (request: string, isRetry: boolean = false) => {
        if (!token || !chat || !request || isStreaming) return;

        // Store request for potential retry
        lastRequestRef.current = request;
        setError(null);

        if (messages.length === 0 && !isRetry) {
            updateChatTitle(chat.id, request, token).then((title) => {
                if (title) {
                    // Trigger frontend animation
                    setStreamingTitle({ chatId: chat.id, title, complete: true });
                    updateChatTitleInList(chat.id, title);
                }
            });
        }

        // Add user message only if not a retry
        if (!isRetry) {
            setMessages((prev) => [
                ...prev,
                {
                    content: request,
                    role: "user",
                    id: (prev[prev.length - 1]?.id ?? -1) + 1
                }
            ]);
        }

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
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error: ${response.status}`);
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

                    // Check for error marker in stream
                    if (chunk.includes("[ERROR]")) {
                        const errorMatch = chunk.match(/\[ERROR\](.+)$/);
                        if (errorMatch && typeof errorMatch == "string") {
                            try {
                                const errorData = JSON.parse(errorMatch[1]);
                                setError({ message: errorData.message, type: errorData.type });
                            } catch {
                                setError({ message: "Something went wrong. Please try again.", type: "unknown" });
                            }
                            // Remove error marker from displayed text
                            const cleanChunk = chunk.replace(/\n?\[ERROR\].+$/, "");
                            if (cleanChunk) {
                                fullMessageRef.current += cleanChunk;
                                addChunk(cleanChunk);
                            }
                            setLoading(false);
                            setIsStreaming(false);
                            return;
                        }
                    }

                    fullMessageRef.current += chunk;
                    addChunk(chunk);
                }
            }

            // Mark streaming as complete - the effect will handle adding to messages
            setStreamingComplete(true);
        } catch (err: any) {
            console.error('Failed to send message:', err);
            setError({ message: err.message || "Failed to send message. Please try again.", type: "network" });
            setLoading(false);
            reset();
            setIsStreaming(false);
        }
    };

    const handleClick = async () => {
        const request = input.trim();
        if (!request) return;
        await sendMessage(request);
    };

    const handleRetry = async () => {
        if (!lastRequestRef.current) return;
        setError(null);
        reset();
        await sendMessage(lastRequestRef.current, true);
    };

    useEffect(() => {
        if (!token || !chat) return;

        // Clear error when switching chats
        setError(null);

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
    }, [messages, displayedText, error]);

    return (
        <div className="flex flex-col flex-1 h-full handlee-regular selection:bg-yellow-100">
            <div className="h-12 max-w-full flex justify-end items-center px-4 bg-stone-50">
                <button
                    className="bg-yellow-400 text-black py-2 px-4 rounded-lg cursor-pointer hover:bg-amber-300"
                    onClick={() => setShowShareModal(true)}
                >
                    Share
                </button>
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
                                className={`w-10 h-10 transition-all duration-300 text-amber-300 animate-squeeze`}
                            />
                        </div>
                    )}

                    {displayedText !== "" && (
                        <div className="flex flex-col items-start mt-2">
                            <div className="prose">
                                <ReactMarkdown>{displayedText}</ReactMarkdown>
                            </div>
                            <div className="flex items-center mt-1">
                                <LemonAnimation size="lg"/>
                            </div>
                        </div>
                    )}

                    {displayedText === "" &&
                        !loading && !error && (
                        <div className="flex flex-col items-start mt-2">
                            {getLastAssistantMessage() && (
                                <>
                                    <div className="flex items-center gap-2 mb-2">
                                        <button
                                            onClick={handleCopy}
                                            className="flex items-center gap-1 text-stone-400 hover:text-amber-500 transition-colors cursor-pointer"
                                            title="Copy response"
                                        >
                                            <IoCopyOutline size={18} />
                                            <span className="text-sm">{copied ? "Copied!" : "Copy"}</span>
                                        </button>
                                        <button
                                            onClick={handleRegenerate}
                                            disabled={isStreaming}
                                            className="flex items-center gap-1 text-stone-400 hover:text-amber-500 transition-colors disabled:opacity-50 cursor-pointer"
                                            title="Regenerate response"
                                        >
                                            <IoRefresh size={18} />
                                            <span className="text-sm">Regenerate</span>
                                        </button>
                                    </div>
                                    <div className="flex items-center mt-2 mb-8">
                                        <GiCutLemon
                                            className={`w-10 h-10 transition-all duration-300 text-amber-300`}
                                        />
                                    </div>
                                </>
                            )}

                        </div>
                    )}

                    {error && (
                        <div className="flex flex-col items-start mt-4 p-4 bg-red-50 border border-red-200 rounded-lg max-w-xl">
                            <div className="flex items-center gap-2 text-red-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span className="font-medium">Error</span>
                            </div>
                            <p className="text-red-700 mt-1">{error.message}</p>
                            <button
                                onClick={handleRetry}
                                className="mt-3 flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Retry
                            </button>
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
                            {isStreaming ? "Stop" : "Send"}
                        </button>
                    </div>
                </div>
            </div>

            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                chatId={chat?.id || ""}
                chatTitle={chat?.title || ""}
            />
        </div>
    );
}