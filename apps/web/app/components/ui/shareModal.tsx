"use client"
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoCloseOutline, IoCopyOutline, IoCheckmark } from "react-icons/io5";
import { toast, Toaster } from "sonner";
import { BACKEND_URL, getAuthTokenKey } from "../../services/config";

type ShareModalProps = {
    isOpen: boolean;
    onClose: () => void;
    chatId: string;
    chatTitle: string;
};

export const ShareModal = ({ isOpen, onClose, chatId, chatTitle }: ShareModalProps) => {
    const [isShareable, setIsShareable] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);

    const shareUrl = typeof window !== "undefined"
        ? `${window.location.origin}/share/${chatId}`
        : "";

    // Fetch current share status
    useEffect(() => {
        if (!isOpen) return;

        const fetchShareStatus = async () => {
            setLoading(true);
            const token = localStorage.getItem(getAuthTokenKey());
            if (!token) return;

            try {
                const response = await fetch(`${BACKEND_URL}/api/chat`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await response.json();
                const chat = data.chats?.find((c: any) => c.id === chatId);
                setIsShareable(chat?.shareable || false);
            } catch (error) {
                console.error("Failed to fetch share status:", error);
            }
            setLoading(false);
        };

        fetchShareStatus();
    }, [isOpen, chatId]);

    const handleToggle = async () => {
        setToggling(true);
        const token = localStorage.getItem(getAuthTokenKey());
        if (!token) return;

        try {
            const response = await fetch(`${BACKEND_URL}/api/chat/${chatId}/share`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ shareable: isShareable })
            });

            if (response.ok) {
                const data = await response.json();
                setIsShareable(data.shareable);
                toast.success(data.shareable ? "Chat is now shareable" : "Chat is now private");
            }
        } catch (error) {
            toast.error("Failed to update share settings");
        }
        setToggling(false);
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard!");
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <Toaster position="top-right" richColors />

                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-40"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="fixed top-1/4 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
                            <h2 className="text-lg font-medium text-black handlee-regular">Share this chat</h2>
                            <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
                                <IoCloseOutline size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <svg className="w-6 h-6 text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                </div>
                            ) : (
                                <>
                                    {/* Toggle */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-black handlee-regular">Anyone with the link can view</p>
                                            <p className="text-sm text-stone-400 handlee-regular">Shared chats are read-only</p>
                                        </div>
                                        <button
                                            onClick={handleToggle}
                                            disabled={toggling}
                                            className={`relative w-12 h-6 rounded-full transition-colors ${
                                                isShareable ? "bg-amber-400" : "bg-stone-300"
                                            } ${toggling ? "opacity-50" : ""}`}
                                        >
                                            <motion.div
                                                animate={{ x: isShareable ? 30 : 2 }}
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                                            />
                                        </button>
                                    </div>

                                    {/* Share link */}
                                    {isShareable && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            className="overflow-hidden"
                                        >
                                            <div className="flex items-center gap-2 p-2 bg-stone-100 rounded-lg">
                                                <input
                                                    type="text"
                                                    value={shareUrl}
                                                    readOnly
                                                    className="flex-1 bg-transparent text-sm text-black outline-none handlee-regular truncate"
                                                />
                                                <button
                                                    onClick={handleCopy}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-black rounded-lg transition-colors handlee-regular"
                                                >
                                                    <IoCopyOutline size={16} />
                                                    Copy
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
