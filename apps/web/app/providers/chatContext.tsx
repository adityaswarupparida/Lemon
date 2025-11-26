"use client"
import { createContext, ReactNode, useState } from "react";

type ChatContextType = {
  chat: string;
  setChat: React.Dispatch<React.SetStateAction<string>>;
};

export const ChatContext = createContext<ChatContextType | null>(null);

export const ChatContextProvider = ({ children }: { children: ReactNode }) => {
    const [chat, setChat] = useState<string>("edccf30d-8932-4946-af60-8002fba8fb93");

    return (
        <ChatContext.Provider value={{chat, setChat}}>
            {children}
        </ChatContext.Provider>
    );
}