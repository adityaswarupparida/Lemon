"use client"
import { memo, RefObject } from "react";
import ReactMarkdown from "react-markdown";
import { Message, MessageBubble } from "../messageBubble";
import { GiCutLemon } from "react-icons/gi";
import { LemonAnimation } from "./lemonAnimation";
import { IoCopyOutline, IoRefresh } from "react-icons/io5";

type ChatMessagesProps = {
    messages: Message[];
    loading: boolean;
    isStreaming: boolean;
    displayedText: string;
    remainingSpace: number;
    error: { message: string; type: string } | null;
    copied: boolean;
    hasLastAssistantMessage: boolean;
    containerRef: RefObject<HTMLDivElement | null>;
    lastUserMsgRef: RefObject<HTMLDivElement | null>;
    responseContentRef: RefObject<HTMLDivElement | null>;
    scrollAnchorRef: RefObject<HTMLDivElement | null>;
    onCopy: () => void;
    onRegenerate: () => void;
    onRetry: () => void;
};

export const ChatMessages = memo(({
    messages,
    loading,
    isStreaming,
    displayedText,
    remainingSpace,
    error,
    copied,
    hasLastAssistantMessage,
    containerRef,
    lastUserMsgRef,
    responseContentRef,
    scrollAnchorRef,
    onCopy,
    onRegenerate,
    onRetry,
}: ChatMessagesProps) => {
    return (
        <div
            className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-white
                [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-amber-200 px-40 text-black [overflow-anchor:none]"
            ref={containerRef}
        >
            {messages.map((msg, index) => {
                const isLastUserMsg = msg.role === 'user' && index === messages.length - 1;
                return (
                    <div key={msg.id} ref={isLastUserMsg ? lastUserMsgRef : null}>
                        <MessageBubble message={msg} loading={false} />
                    </div>
                );
            })}

            {/* Response area - always rendered to prevent jump */}
            <div
                className={`flex flex-col ${(loading || isStreaming) ? 'min-h-[70vh]' : ''}`}
                style={!loading && !isStreaming && remainingSpace > 0 ? { minHeight: remainingSpace } : undefined}
            >
                {/* Loading state */}
                {loading && (
                    <div className="flex flex-col items-start mt-2">
                        <GiCutLemon
                            className="w-8 h-8 transition-all duration-300 text-amber-300 animate-squeeze"
                        />
                    </div>
                )}

                {/* Streaming response */}
                {displayedText !== "" && (
                    <div ref={responseContentRef} className="flex flex-col items-start mt-2">
                        <div className="prose">
                            <ReactMarkdown>{displayedText}</ReactMarkdown>
                        </div>
                        <div className="flex items-center mt-2 mb-8">
                            <LemonAnimation size="md"/>
                        </div>
                    </div>
                )}

                {/* Idle state - copy/regenerate buttons */}
                {displayedText === "" && !loading && !error && !isStreaming && hasLastAssistantMessage && (
                    <div className="flex flex-col items-start mt-2">
                        <div className="flex items-center gap-2 mb-2">
                            <button
                                onClick={onCopy}
                                className="flex items-center gap-1 text-stone-400 hover:text-amber-500 transition-colors cursor-pointer"
                                title="Copy response"
                            >
                                <IoCopyOutline size={18} />
                                <span className="text-sm">{copied ? "Copied!" : "Copy"}</span>
                            </button>
                            <button
                                onClick={onRegenerate}
                                disabled={isStreaming}
                                className="flex items-center gap-1 text-stone-400 hover:text-amber-500 transition-colors disabled:opacity-50 cursor-pointer"
                                title="Regenerate response"
                            >
                                <IoRefresh size={18} />
                                <span className="text-sm">Regenerate</span>
                            </button>
                        </div>
                        <div className="flex items-center mt-2 mb-8">
                            <GiCutLemon
                                className="w-8 h-8 transition-all duration-300 text-amber-400/80"
                            />
                        </div>
                    </div>
                )}

                {/* Spacer always present - fills remaining space */}
                <div className="grow" />
            </div>

            {error && (
                <div className="flex flex-col items-start mt-4 p-4 bg-red-50/60 border border-red-400/60 rounded-lg max-w-xl">
                    <div className="flex justify-start items-center gap-2 text-red-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p>{error.message}</p>
                    </div>
                    <button
                        onClick={onRetry}
                        className="mt-2 flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg transition-colors cursor-pointer text-sm"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Retry
                    </button>
                </div>
            )}

            {/* Scroll anchor */}
            <div ref={scrollAnchorRef} className="h-px" />
        </div>
    );
});
