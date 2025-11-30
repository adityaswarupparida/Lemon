"use client"
import { Sidebar } from "./sidebar";
import { ChatInterface } from "./chatInterface";
import { useContext, useEffect, useState } from "react";
import { ChatContext } from "../providers/chatContext";
import { Home } from "./home";
import { useRouter } from "next/navigation";

export const ChatWorkspace = () => {
    const ctx = useContext(ChatContext);
    if (!ctx) return null;
    const { chat, setChat } = ctx;
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("auth_token");
        if (!token) 
            router.push("/signup");
        else 
            setLoading(false)
    }, []);

    if (loading) return null;

    return (
        <>
            <Sidebar setChat={setChat} />
            { chat !== "" && <ChatInterface  chat={chat} setChat={setChat} /> }
            { chat === "" && <Home /> }

        </>
    )
}