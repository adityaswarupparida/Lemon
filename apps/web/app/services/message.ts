import { BACKEND_URL } from "./config";

export const getMessages = async (chatId: string, token: string) => {
    const response = await fetch(`${BACKEND_URL}/api/message/${chatId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
    });

    const results = await response.json();
    console.log(results);
    return results.messages;
}