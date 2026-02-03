"use client"
import { GiCutLemon } from "react-icons/gi";
import { AiOutlineWechat } from "react-icons/ai";
import { GoSearch } from "react-icons/go";
import { IoIosArrowDown } from "react-icons/io";
import { IoSettingsOutline, IoLogOutOutline } from "react-icons/io5";
import { useContext, useEffect, useRef, useState } from "react";
import { createNewChat, getChats } from "../services/chat";
import { useRouter } from "next/navigation";
import { getDetails } from "../services/user";
import { User } from "../types";
import { concatenate, getInitials } from "../utils";
import { ChatContext } from "../providers/chatContext";
import { getAuthTokenKey } from "../services/config";
import { motion, AnimatePresence } from "framer-motion";
import { SearchModal } from "./ui/searchModal";

export const Sidebar = () => {
    const router = useRouter();
    const context = useContext(ChatContext);
    const { setChat, chats, setChats, streamingTitle, setStreamingTitle } = context!;
    const [toggleChats, setToggleChats] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [chatsLoading, setChatsLoading] = useState<boolean>(true);
    const [user, setUser] = useState<User>();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showSearch, setShowSearch] = useState(false);

    // Typing animation for streaming title
    const [displayedTitle, setDisplayedTitle] = useState("");
    const titleIndexRef = useRef(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const targetTitleRef = useRef("");

    useEffect(() => {
        if (!streamingTitle) {
            // Clear everything when streaming ends
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setDisplayedTitle("");
            titleIndexRef.current = 0;
            targetTitleRef.current = "";
            return;
        }

        // Update target title
        targetTitleRef.current = streamingTitle.title;

        // Start typing if not already running
        if (!intervalRef.current) {
            intervalRef.current = setInterval(() => {
                if (titleIndexRef.current < targetTitleRef.current.length) {
                    titleIndexRef.current++;
                    setDisplayedTitle(targetTitleRef.current.slice(0, titleIndexRef.current));
                }
            }, 30); // Adjust speed here (higher = slower)
        }
    }, [streamingTitle, setStreamingTitle]);

    // Check if animation is complete
    useEffect(() => {
        if (
            streamingTitle?.complete &&
            displayedTitle.length >= streamingTitle.title.length &&
            streamingTitle.title.length > 0
        ) {
            // Animation complete - clear streaming title
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setStreamingTitle(null);
        }
    }, [displayedTitle, streamingTitle, setStreamingTitle]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        let token = localStorage.getItem(getAuthTokenKey());
        setToken(token);
        setLoading(false);
    }, [])

    useEffect(() => {
        if (loading) return;
        if (!token)
            router.push("/signin");
    }, [token, loading, router])

    useEffect(() => {
        if (!token) return;

        (async () => {
            try {
                const fetchedChats = await getChats(token);
                setChats(fetchedChats);
            } finally {
                setChatsLoading(false);
            }
        })();

        (async () => {
            const response = await getDetails(token);
            setUser(response.user);
        })();

    }, [token, setChats])

    const handleNewChat = async () => {
        if (!token) return;
        const chatId = await createNewChat(token);
        setChats((prev) => [{ id: chatId, title: "Untitled" }, ...prev]);
        setChat({ id: chatId, title: "Untitled" });
    }

    const handleLogout = () => {
        if (loading) return;
        localStorage.removeItem(getAuthTokenKey());
        setToken(null);
    }

    return (
        <div className="min-w-60 w-60 bg-stone-50 hidden sm:block h-full overflow-hidden relative">
            <div
                className="flex items-center justify-start gap-2 pl-2 pb-1 cursor-pointer"
                onClick={() => setChat(null)}
            >
                <GiCutLemon fill="oklch(85.2% 0.199 91.936)" size={40} className="transition-all duration-300 text-amber-300 hover:animate-squeeze"/>
                <span className="text-3xl pt-2 handlee-regular text-black">Lemon</span>
            </div>
            <div className="mt-3 flex flex-col">
                <div className="flex items-center justify-start gap-2 pl-3 hover:bg-stone-200 cursor-pointer"
                    onClick={handleNewChat}
                >
                    <AiOutlineWechat fill="oklch(85.2% 0.199 91.936)" size={30} />
                    <span className="text-lg pt-2 pl-2 handlee-regular text-black">New chat</span>
                </div>
                <div
                    className="flex items-center justify-start gap-2 pl-3 hover:bg-stone-200 cursor-pointer"
                    onClick={() => setShowSearch(true)}
                >
                    <GoSearch fill="oklch(85.2% 0.199 91.936)" size={30} />
                    <span className="text-lg pt-2 pl-2 handlee-regular text-black">Search chats</span>
                </div>
            </div>
            <div className="mt-4 overflow-y-auto w-full">
                <button className="flex items-center justify-start gap-2 pl-5 hover:cursor-pointer"
                    onClick={() => setToggleChats(cur => !cur)}
                >
                    <span className="text-lg handlee-regular text-black">Your chats</span>
                    <motion.div
                        animate={{ rotate: toggleChats ? 0 : -90 }}
                        transition={{ duration: 0.2 }}
                    >
                        <IoIosArrowDown fill="black" size={15} />
                    </motion.div>
                </button>
                <AnimatePresence>
                    {toggleChats && chatsLoading && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col gap-2 pl-5 pr-5 overflow-hidden"
                        >
                            {[...Array(20)].map((_, i) => (
                                <div key={i} className="h-5 pt-2 w-full bg-stone-200 rounded animate-pulse" />
                            ))}
                        </motion.div>
                    )}
                    {toggleChats && !chatsLoading && chats && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            {chats.map((c) => {
                                const isStreaming = streamingTitle?.chatId === c.id;
                                const title = isStreaming
                                    ? (displayedTitle || "...")
                                    : c.title;
                                return (
                                    <div
                                        key={c.id}
                                        onClick={() => setChat({ id: c.id, title: c.title })}
                                        className="text-black handlee-regular pl-5 pt-2 line-clamp-1 hover:bg-stone-200 cursor-pointer"
                                    >
                                        {title}
                                    </div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <div className="text-black bg-white h-16 bottom-0 left-0 absolute w-full pl-3 pr-1 border border-t border-stone-100 shadow-xl">
                <div className="relative h-full flex items-center">
                    <div
                        className="flex items-center cursor-pointer hover:bg-stone-100 rounded-lg p-2 -ml-2 flex-1"
                        onClick={() => setShowUserMenu(prev => !prev)}
                    >
                        <div className="relative flex justify-center items-center">
                            <div className="h-8 w-8 bg-amber-500 rounded-full"></div>
                            <div className="absolute text-white">{getInitials(user?.firstName, user?.lastName)}</div>
                        </div>
                        <div className="truncate pl-2 handlee-regular flex flex-col items-start flex-1">
                            <div className="text-md">{concatenate(user?.firstName, user?.lastName, " ")}</div>
                            <div className="text-xs">{user?.email}</div>
                        </div>
                        <IoIosArrowDown className={`text-stone-400 transition-transform ${showUserMenu ? "rotate-180" : ""}`} />
                    </div>

                    <AnimatePresence>
                        {showUserMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.15 }}
                                className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-lg shadow-lg border border-stone-200 overflow-hidden"
                            >
                                {/* <div className="flex items-center gap-2 px-3 py-2 hover:bg-stone-100 cursor-pointer">
                                    <IoSettingsOutline className="text-lg text-stone-500" />
                                    <span className="handlee-regular">Settings</span>
                                </div> */}
                                <div
                                    className="flex items-center gap-2 px-3 py-2 hover:bg-red-50 cursor-pointer text-red-500"
                                    onClick={handleLogout}
                                >
                                    <IoLogOutOutline className="text-lg" />
                                    <span className="handlee-regular">Logout</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <SearchModal
                isOpen={showSearch}
                onClose={() => setShowSearch(false)}
                onSelectChat={(chatId, title) => setChat({ id: chatId, title })}
            />
        </div>
    );
}