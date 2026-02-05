"use client"
import { useState, memo } from "react";

type ChatInputProps = {
    onSubmit: (message: string) => void;
    isStreaming: boolean;
};

export const ChatInput = memo(({ onSubmit, isStreaming }: ChatInputProps) => {
    const [input, setInput] = useState("");

    const handleClick = () => {
        const message = input.trim();
        if (!message || isStreaming) return;
        onSubmit(message);
        setInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !isStreaming) {
            handleClick();
        }
    };

    return (
        <div className="h-14 flex items-center px-1 gap-2 bg-stone-100 rounded-3xl">
            <input
                type="text"
                placeholder="Ask anything"
                className="bg-white h-4/5 py-1 px-3 flex-1 text-black text-lg rounded-3xl focus:outline-amber-300 focus:outline-solid disabled:opacity-50"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
            />
            <button
                className="bg-yellow-400 text-black w-20 h-4/5 py-2 px-4 rounded-3xl cursor-pointer hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleClick}
                disabled={isStreaming || !input.trim()}
            >
                {isStreaming ? "Stop" : "Send"}
            </button>
        </div>
    );
});
