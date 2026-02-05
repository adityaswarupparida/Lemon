"use client"
import { useContext, useEffect, useRef, useState, useCallback } from "react";
import { Message } from "./messageBubble";
import { useStreamingText } from "../hooks/useStreamingText";
import { getMessages } from "../services/message";
import { updateChatTitle } from "../services/chat";
import { BACKEND_URL, getAuthTokenKey } from "../services/config";
import { ChatItem } from "../types";
import { ChatContext } from "../providers/chatContext";
import { ShareModal } from "./ui/shareModal";
import { ChatHeader } from "./ui/chatHeader";
import { ChatInput } from "./ui/chatInput";
import { ChatMessages } from "./ui/chatMessages";

export const ChatInterface = ({ chat }: { chat: ChatItem | null }) => {
    const context = useContext(ChatContext);
    const { updateChatTitleInList, setStreamingTitle } = context!;

    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingComplete, setStreamingComplete] = useState(true);
    const [error, setError] = useState<{ message: string; type: string } | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const scrollAnchorRef = useRef<HTMLDivElement | null>(null);
    const scrollRAFRef = useRef<number | null>(null);
    const lastUserMsgRef = useRef<HTMLDivElement | null>(null);
    const responseContentRef = useRef<HTMLDivElement | null>(null);
    const isLongResponseRef = useRef(false);
    const fullMessageRef = useRef("");
    const lastRequestRef = useRef<string>("");
    const [token, setToken] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [remainingSpace, setRemainingSpace] = useState(0);
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
        try {
            if (!navigator.clipboard) throw new Error("Clipboard API unavailable");
            await navigator.clipboard.writeText(lastAssistant.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setError({ message: "Failed to copy to clipboard.", type: "clipboard" });
        }
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
            setRemainingSpace(0); // Reset for new message
            isLongResponseRef.current = false;
            setMessages((prev) => [
                ...prev,
                {
                    content: request,
                    role: "user",
                    id: (prev[prev.length - 1]?.id ?? -1) + 1
                }
            ]);
            // Scroll user message to top after DOM updates
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const container = containerRef.current;
                    const userMsg = lastUserMsgRef.current;
                    if (container && userMsg) {
                        container.scrollTo({
                            top: userMsg.offsetTop,
                            behavior: 'smooth'
                        });
                    }
                });
            });
        }

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
                        if (errorMatch && typeof errorMatch[1] === "string") {
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
        const abortController = new AbortController();

        (async () => {
            try {
                let msgs = await getMessages(chat.id, token, abortController.signal);

                msgs = msgs.map((msg: any) => ({
                    id: msg.id,
                    content: msg.content,
                    role: msg.role.toLowerCase()
                }))
                setMessages(msgs);

                // Scroll to bottom after messages load
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        if (abortController.signal.aborted) return;
                        const container = containerRef.current;
                        if (container) {
                            container.scrollTop = container.scrollHeight;
                        }
                    });
                });
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    console.error('Failed to fetch messages:', err);
                }
            }
        })()

        return () => {
            abortController.abort();
        };
    }, [chat, token]);

    // When typing catches up to the full message, add to messages
    useEffect(() => {
        if (streamingComplete && displayedText.length >= fullMessageRef.current.length && fullMessageRef.current.length > 0) {
            // Calculate remaining space for short responses BEFORE removing streaming content
            const container = containerRef.current;
            const responseContent = responseContentRef.current;
            let calculatedSpace = 0;

            if (!isLongResponseRef.current && container && responseContent) {
                const viewportHeight = container.clientHeight;
                const responseHeight = responseContent.offsetHeight;
                const userMsgHeight = lastUserMsgRef.current?.offsetHeight ?? 0;
                const buttonsHeight = -10; // approximate height for copy/regenerate/lemon
                const totalContentHeight = userMsgHeight + responseHeight + buttonsHeight;
                calculatedSpace = Math.max(0, viewportHeight - totalContentHeight);
            }

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
            setRemainingSpace(calculatedSpace);
        }
    }, [streamingComplete, displayedText, reset]);

    // Scroll to bottom using anchor element
    const scrollToBottom = useCallback((smooth = false) => {
        const container = containerRef.current;
        const anchor = scrollAnchorRef.current;
        if (!container || !anchor) return;

        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
        if (isNearBottom) {
            anchor.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant', block: 'end' });
        }
    }, []);

    // Scroll on errors
    useEffect(() => {
        if (error) scrollToBottom(true);
    }, [error, scrollToBottom]);

    // Throttled scroll during streaming using RAF
    useEffect(() => {
        if (!displayedText || !isStreaming) return;

        if (scrollRAFRef.current) {
            cancelAnimationFrame(scrollRAFRef.current);
        }

        scrollRAFRef.current = requestAnimationFrame(() => {
            // Track if response content exceeds viewport (long response)
            const container = containerRef.current;
            const responseContent = responseContentRef.current;
            if (container && responseContent) {
                const responseHeight = responseContent.offsetHeight;
                const viewportHeight = container.clientHeight;
                if (responseHeight > viewportHeight - 150) {
                    isLongResponseRef.current = true;
                }
            }
            scrollToBottom(false);
        });

        return () => {
            if (scrollRAFRef.current) {
                cancelAnimationFrame(scrollRAFRef.current);
            }
        };
    }, [displayedText, isStreaming, scrollToBottom]);

    return (
        <div className="flex flex-col flex-1 h-full handlee-regular selection:bg-yellow-100">
            <div className="px-4 py-3 flex justify-between items-center bg-white border-b border-stone-50">
                <ChatHeader chat={chat} token={token} />
                <button
                    className="px-5 py-1.5 bg-amber-300 hover:bg-amber-400 text-black rounded-lg cursor-pointer handlee-regular transition-colors"
                    onClick={() => chat && setShowShareModal(true)}
                    disabled={!chat}
                >
                    Share
                </button>
            </div>
            <div className="bg-white flex flex-col flex-1 overflow-hidden">
                <ChatMessages
                    messages={messages}
                    loading={loading}
                    isStreaming={isStreaming}
                    displayedText={displayedText}
                    remainingSpace={remainingSpace}
                    error={error}
                    copied={copied}
                    hasLastAssistantMessage={!!getLastAssistantMessage()}
                    containerRef={containerRef}
                    lastUserMsgRef={lastUserMsgRef}
                    responseContentRef={responseContentRef}
                    scrollAnchorRef={scrollAnchorRef}
                    onCopy={handleCopy}
                    onRegenerate={handleRegenerate}
                    onRetry={handleRetry}
                />
                <div className="px-40 my-3 rounded-3xl">
                    <ChatInput onSubmit={sendMessage} isStreaming={isStreaming} />
                </div>
            </div>

            <ShareModal
                isOpen={showShareModal && !!chat}
                onClose={() => setShowShareModal(false)}
                chatId={chat?.id || ""}
                chatTitle={chat?.title || ""}
            />
        </div>
    );
}