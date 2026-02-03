import { SearchResult } from "../types";
import { BACKEND_URL } from "./config";

export const getChats = async (token: string) => {
    const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const results = await response.json();
    return results.chats;
}

export const createNewChat = async (token: string) => {
    const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            title: "Untitled",
        }),
    });

    const results = await response.json();
    return results.chat;
}

export const updateChatTitle = async (chatId: string, input: string, token: string) => {
    const response = await fetch(`${BACKEND_URL}/api/chat/${chatId}/update-title`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            input,
        }),
    });

    const results = await response.json();
    return results.title;
}

export const searchChats = async (query: string, token: string): Promise<SearchResult[]> => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/chat/search?q=${encodeURIComponent(query)}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.error(`Search failed with status: ${response.status}`);
            return [];
        }
        const results = await response.json();
        return results.results || [];
   } catch (error) {
       console.error('Search request failed:', error);
       return [];
   }
}