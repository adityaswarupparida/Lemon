"use client"
import { Sidebar } from "./sidebar";
import { ChatInterface } from "./chatInterface";
import { useContext, useEffect, useState } from "react";
import { ChatContext } from "../providers/chatContext";
import { Home } from "./home";
import { useRouter } from "next/navigation";
import { getAuthTokenKey } from "../services/config";
import { getDetails } from "../services/user";

export const ChatWorkspace = () => {
    const ctx = useContext(ChatContext);

    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!ctx) return;
        const token = localStorage.getItem(getAuthTokenKey());
        if (!token) {
            router.push("/signup");
            return;
        }

        // Validate token with backend
        getDetails(token)
            .then((result) => {
                if (result.user) {
                    setLoading(false);
                } else {
                    // Token invalid/expired - remove and redirect
                    localStorage.removeItem(getAuthTokenKey());
                    router.push("/signup");
                }
            })
            .catch(() => {
                // Network error - could retry or show error state
                // For now, assume token invalid
                localStorage.removeItem(getAuthTokenKey());
                router.push("/signup");
            });
    }, [ctx, router]);

   if (!ctx || loading) return (
        <div className="flex items-center justify-center w-full h-screen">
            <svg className="w-8 h-8 text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
        </div>
    );

    const { chat } = ctx;

    return (
        <>
            <Sidebar />
            {chat && <ChatInterface chat={chat} />}
            {!chat && <Home />}
        </>
    )
}