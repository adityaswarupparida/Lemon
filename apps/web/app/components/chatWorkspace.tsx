"use client"
import { Sidebar } from "./sidebar";
import { ChatInterface } from "./chatInterface";
import { useContext } from "react";
import { ChatContext } from "../providers/chatContext";
import { Home } from "./home";

export const ChatWorkspace = () => {
    const ctx = useContext(ChatContext);
    if (!ctx) return <div>Invalid ChatId</div>;
    const { chat, setChat } = ctx;

    return (
        <>
            <Sidebar setChat={setChat} />
            { chat !== "" && <ChatInterface  chat={chat} /> }
            { chat === "" && <Home /> }

        </>
    )
}