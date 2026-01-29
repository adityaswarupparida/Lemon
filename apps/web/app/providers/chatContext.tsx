"use client"
import { createContext, ReactNode, useState } from "react";
import { ChatItem } from "../types";

type ChatContextType = {
  chat: ChatItem | null;
  setChat: React.Dispatch<React.SetStateAction<ChatItem | null>>;
};

export const ChatContext = createContext<ChatContextType | null>(null);

export const ChatContextProvider = ({ children }: { children: ReactNode }) => {
    const [chat, setChat] = useState<ChatItem | null>(null);

    return (
        <ChatContext.Provider value={{chat, setChat}}>
            {children}
        </ChatContext.Provider>
    );
}