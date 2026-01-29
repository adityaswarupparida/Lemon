"use client"
import { createContext, ReactNode, useCallback, useState } from "react";
import { ChatItem } from "../types";

type StreamingTitle = {
    chatId: string;
    title: string;
    complete?: boolean; // true when all chunks have been received
} | null;

type ChatContextType = {
    chat: ChatItem | null;
    setChat: React.Dispatch<React.SetStateAction<ChatItem | null>>;
    chats: ChatItem[];
    setChats: React.Dispatch<React.SetStateAction<ChatItem[]>>;
    updateChatTitleInList: (chatId: string, newTitle: string) => void;
    streamingTitle: StreamingTitle;
    setStreamingTitle: React.Dispatch<React.SetStateAction<StreamingTitle>>;
};

export const ChatContext = createContext<ChatContextType | null>(null);

export const ChatContextProvider = ({ children }: { children: ReactNode }) => {
    const [chat, setChat] = useState<ChatItem | null>(null);
    const [chats, setChats] = useState<ChatItem[]>([]);
    const [streamingTitle, setStreamingTitle] = useState<StreamingTitle>(null);

    const updateChatTitleInList = useCallback((chatId: string, newTitle: string) => {
        setChats((prev) =>
            prev.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c))
        );
        // Also update current chat if it's the one being renamed
        setChat((prev) => (prev?.id === chatId ? { ...prev, title: newTitle } : prev));
    }, []);

    return (
        <ChatContext.Provider value={{
            chat, setChat, chats, setChats,
            updateChatTitleInList, streamingTitle, setStreamingTitle
        }}>
            {children}
        </ChatContext.Provider>
    );
}