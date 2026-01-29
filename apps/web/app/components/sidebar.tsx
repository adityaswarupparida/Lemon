"use client"
import { GiCutLemon } from "react-icons/gi";
import { AiOutlineWechat } from "react-icons/ai";
import { GoSearch } from "react-icons/go";
import { IoIosArrowDown, IoIosArrowForward, IoIosLogOut } from "react-icons/io";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { createNewChat, getChats } from "../services/chat";
import { useRouter } from "next/navigation";
import { getDetails } from "../services/user";
import { User } from "../types";
import { concatenate, getInitials } from "../utils";
import { ChatItem } from "../types";

export const Sidebar = ({ chat, setChat }: { 
    chat: ChatItem | null, 
    setChat: Dispatch<SetStateAction<ChatItem | null>> 
}) => {
    const router = useRouter();
    const [chats, setChats] = useState<ChatItem[]>([]);
    const [toggleChats, setToggleChats] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [user, setUser] = useState<User>();

    useEffect(() => {
        let token = localStorage.getItem("auth_token");
        setToken(token);
        setLoading(false);
    }, [])

    useEffect(() => {
        if (loading) return;
        if (!token) 
            router.push("/signin");
    }, [token])

    useEffect(() => {
        if (!token) return;

        (async () => {
            const chats = await getChats(token);
            setChats(chats)
        })();

        (async () => {
            const response = await getDetails(token);
            setUser(response.user);
        })();

    }, [token])

    const handleNewChat = async () => {
        if (!token) return;
        const chatId = await createNewChat(token);
        setChats((prev) => [{ id: chatId, title: "Untitled" }, ...prev]);
        setChat({ id: chatId, title: "Untitled" });
    }

    const handleLogout = () => {
        if (loading) return;
        localStorage.removeItem("auth_token");
        setToken(null);
    }

    return (
        <div className="min-w-60 w-60 bg-stone-50 hidden sm:block h-full overflow-hidden relative">
            <div className="flex items-center justify-start gap-2 pl-2 pb-1 cursor-pointer">
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
                <div className="flex items-center justify-start gap-2 pl-3 hover:bg-stone-200 cursor-pointer">
                    <GoSearch fill="oklch(85.2% 0.199 91.936)" size={30} />
                    <span className="text-lg pt-2 pl-2 handlee-regular text-black">Search chats</span>
                </div>
            </div>
            <div className="mt-4 overflow-y-auto w-full">
                <button className="flex items-center justify-start gap-2 pl-5 hover:cursor-pointer"
                    onClick={() => setToggleChats(cur => !cur)}
                >
                    <span className="text-lg handlee-regular text-black">Your chats</span>
                    { toggleChats && <IoIosArrowDown fill="black" size={15} /> }
                    { !toggleChats && <IoIosArrowForward fill="black" size={15} /> }
                </button>
                {toggleChats && chats && <div>
                    {chats.map((c, ind) => (
                        <div key={`${ind}`} onClick={() => setChat({ id: c.id, title: c.title })} className="text-black handlee-regular pl-5 pt-2 line-clamp-1 hover:bg-stone-200 cursor-pointer">
                            {c.title}
                        </div>
                    ))}
                </div>}
            </div>
            <div className="text-black bg-white h-16 bottom-0 left-0 absolute w-full flex items-center justify-between px-3 border border-t border-stone-100 shadow-xl">
                <div className="flex items-center">
                    <div className="relative flex justify-center items-center">
                        <div className="h-8 w-8 bg-amber-500  rounded-full"></div>
                        <div className="absolute text-white">{getInitials(user?.firstName, user?.lastName)}</div>
                    </div>
                    <div className="truncate pl-2 handlee-regular flex flex-col items-start">
                        <div className="text-md">{concatenate(user?.firstName, user?.lastName, " ")}</div>
                        <div className="text-xs">{user?.email}</div>
                    </div>
                </div>
                <div onClick={handleLogout}>
                    <IoIosLogOut className="text-3xl text-stone-300 hover:text-red-500 cursor-pointer" />
                </div>
            </div>
        </div>
    );
}