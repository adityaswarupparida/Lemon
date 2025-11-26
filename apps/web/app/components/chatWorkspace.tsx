import { ChatContextProvider } from "../providers/chatContext";
import { Sidebar } from "./sidebar";
import { ChatInterface } from "./chatInterface";

export const ChatWorkspace = () => {

    return (
        <ChatContextProvider>
            <Sidebar />
            <ChatInterface />
        </ChatContextProvider>
    )
}