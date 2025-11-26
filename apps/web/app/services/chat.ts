import { BACKEND_URL } from "./config";

export const getChats = async () => {
    const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "GET",
    });

    const results = await response.json();
    console.log(results);
    return results.chats;
}