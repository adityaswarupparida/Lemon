import { BACKEND_URL } from "./config";

export const getChats = async () => {
    const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "GET",
    });

    const results = await response.json();
    console.log(results);
    return results.chats;
}

export const createNewChat = async () => {
    const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title: "Untitled",
        }),
    });

    const results = await response.json();
    console.log(results);
    return results.chat;
}

export const updateChatTitle = async (chatId: string, input: string) => {
    const response = await fetch(`${BACKEND_URL}/api/chat/${chatId}/update-title`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            input,
        }),
    });
    
    const results = await response.json();
    console.log(results);
    return results.title;
}