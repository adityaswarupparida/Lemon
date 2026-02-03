"use client"
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GiCutLemon } from "react-icons/gi";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { BACKEND_URL } from "../../services/config";

type Message = {
    id: string;
    content: string;
    role: string;
    createdAt: string;
};

type SharedChat = {
    id: string;
    title: string;
    author: string;
    createdAt: string;
};

export default function SharedChatPage() {
    const params = useParams();
    const chatId = params.chatId as string;

    const [chat, setChat] = useState<SharedChat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!chatId) return;
        setLoading(true);
        setError(null);
        setChat(null);
        setMessages([]);
        
        const fetchSharedChat = async () => {
            try {
                const response = await fetch(`${BACKEND_URL}/api/share/${chatId}`);

                if (!response.ok) {
                    if (response.status === 404) {
                        setError("This chat is not available or has been made private.");
                    } else {
                        setError("Failed to load shared chat.");
                    }
                    setLoading(false);
                    return;
                }

                const data = await response.json();
                setChat(data.chat);
                setMessages(data.messages);
            } catch (err) {
                setError("Failed to load shared chat.");
            }
            setLoading(false);
        };

        fetchSharedChat();
    }, [chatId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <svg className="w-8 h-8 text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
                <GiCutLemon className="w-16 h-16 text-amber-300" />
                <p className="text-xl text-black handlee-regular">{error}</p>
                <Link
                    href="/signup"
                    className="mt-4 px-6 py-2 bg-amber-400 hover:bg-amber-500 text-black rounded-lg handlee-regular transition-colors"
                >
                    Try Lemon
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header */}
            <header className="sticky top-0 bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                    <GiCutLemon className="w-8 h-8 text-amber-300" />
                    <span className="text-xl handlee-regular text-black">Lemon</span>
                    <span className="ml-4 px-2 py-0.5 bg-stone-100 text-stone-500 text-sm rounded handlee-regular">
                        Shared Chat
                    </span>
                </div>
                <Link
                    href="/signup"
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-black rounded-lg handlee-regular transition-colors"
                >
                    Try Lemon
                </Link>
            </header>

            {/* Chat title */}
            <div className="px-4 py-6 border-b border-stone-100 text-center">
                <h1 className="text-2xl text-black handlee-regular">{chat?.title}</h1>
                <p className="text-sm text-stone-400 mt-1 handlee-regular">
                    Shared by {chat?.author}
                </p>
            </div>

            {/* Messages */}
            <div className="flex-1 px-4 md:px-40 py-6 overflow-y-auto">
                {messages.map((msg) => (
                    <div key={msg.id} className="mb-6">
                        {msg.role.toLowerCase() === "user" ? (
                            <div className="flex justify-end">
                                <div className="bg-amber-100 text-black px-4 py-2 rounded-2xl max-w-2xl handlee-regular">
                                    {msg.content}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-3">
                                <GiCutLemon className="w-8 h-8 text-amber-300 shrink-0 mt-1" />
                                <div className="prose max-w-none text-black handlee-regular">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer CTA */}
            <footer className="sticky bottom-0 bg-stone-50 border-t border-stone-200 px-4 py-4 text-center">
                <p className="text-black handlee-regular mb-2">Want to start your own conversation?</p>
                <Link
                    href="/signup"
                    className="inline-block px-6 py-2 bg-amber-400 hover:bg-amber-500 text-black rounded-lg handlee-regular transition-colors"
                >
                    Sign up free
                </Link>
            </footer>
        </div>
    );
}
