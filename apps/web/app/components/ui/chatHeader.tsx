"use client"
import { useContext, useRef, useState, memo } from "react";
import { ChatItem } from "../../types";
import { updateChatTitle } from "../../services/chat";
import { ChatContext } from "../../providers/chatContext";

export const ChatHeader = memo(({ chat, token }: {
    chat: ChatItem | null,
    token: string | null
}) => {
    const context = useContext(ChatContext);
    const { updateChatTitleInList } = context!;

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState("");
    const titleInputRef = useRef<HTMLInputElement>(null);

    // Title editing handlers
    const handleTitleDoubleClick = () => {
        if (!chat) return;
        setEditedTitle(chat.title || "New Chat");
        setIsEditingTitle(true);
        setTimeout(() => titleInputRef.current?.select(), 0);
    };

    const handleTitleSave = async () => {
        if (!chat || !token || !editedTitle.trim()) {
            setIsEditingTitle(false);
            return;
        }

        const newTitle = editedTitle.trim();
        if (newTitle === chat.title) {
            setIsEditingTitle(false);
            return;
        }

        try {
            await updateChatTitle(chat.id, newTitle, token);
            updateChatTitleInList(chat.id, newTitle);
        } catch (err) {
            console.error("Failed to update title:", err);
        }
        setIsEditingTitle(false);
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleTitleSave();
        } else if (e.key === "Escape") {
            setIsEditingTitle(false);
        }
    };

    if (isEditingTitle) {
        return  (
            <input
                ref={titleInputRef}
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                className="text-md handlee-regular text-black max-w-lg bg-white border border-stone-300 rounded-lg outline-none px-3 pt-1.5 focus:border-amber-400 focus:ring-1 focus:ring-amber-100"
                autoFocus
            />
        )
    }

    return (
        <h1
            className="text-md handlee-regular text-black truncate max-w-lg cursor-pointer hover:bg-stone-100 px-2 py-1 rounded transition-colors"
            onDoubleClick={handleTitleDoubleClick}
            title="Double-click to edit"
        >
            {chat?.title || "New Chat"}
        </h1>
    );
});