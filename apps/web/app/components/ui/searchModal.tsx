"use client"
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GoSearch } from "react-icons/go";
import { IoCloseOutline } from "react-icons/io5";
import { searchChats, SearchResult } from "../../services/chat";
import { getAuthTokenKey } from "../../services/config";

type SearchModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSelectChat: (chatId: string, title: string) => void;
};

export const SearchModal = ({ isOpen, onClose, onSelectChat }: SearchModalProps) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery("");
            setResults([]);
        }
    }, [isOpen]);

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (query.trim().length < 2) {
            setResults([]);
            return;
        }

        setLoading(true);
        debounceRef.current = setTimeout(async () => {
            const token = localStorage.getItem(getAuthTokenKey());
            if (!token) return;

            const searchResults = await searchChats(query, token);
            setResults(searchResults);
            setLoading(false);
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    const handleSelect = (result: SearchResult) => {
        onSelectChat(result.chatId, result.title);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
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
                        {/* Search input */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-200">
                            <GoSearch className="text-stone-400 text-xl" />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search chats..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="flex-1 text-lg text-black outline-none handlee-regular"
                            />
                            <button onClick={onClose} className="text-stone-400 hover:text-stone-600 cursor-pointer">
                                <IoCloseOutline size={24} />
                            </button>
                        </div>

                        {/* Results */}
                        <div className="h-80 overflow-y-auto">
                            {loading && (
                                <div className="flex items-center justify-center py-8">
                                    <svg className="w-6 h-6 text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                </div>
                            )}

                            {!loading && query.length >= 2 && results.length === 0 && (
                                <div className="text-center py-8 text-stone-400 handlee-regular">
                                    No results found for "{query}"
                                </div>
                            )}

                            {!loading && results.map((result) => (
                                <div
                                    key={result.chatId}
                                    onClick={() => handleSelect(result)}
                                    className="px-4 py-3 hover:bg-stone-100 cursor-pointer border-b border-stone-100 last:border-b-0"
                                >
                                    <div className="text-black font-medium handlee-regular">{result.title}</div>
                                    <div className="text-sm text-stone-500 line-clamp-1 handlee-regular">{result.snippet}</div>
                                </div>
                            ))}

                            {!loading && query.length < 2 && (
                                <div className="text-center py-8 text-stone-400 handlee-regular">
                                    Type at least 2 characters to search
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
