"use client"
import { GiCutLemon } from "react-icons/gi";
import { AiOutlineWechat } from "react-icons/ai";
import { GoSearch } from "react-icons/go";
import { IoIosArrowDown, IoIosArrowForward } from "react-icons/io";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { createNewChat, getChats } from "../services/chat";

export const Sidebar = ({ setChat }: { setChat: Dispatch<SetStateAction<string>> }) => {
    const [chats, setChats] = useState<any[]>([]);
    const [toggleChats, setToggleChats] = useState(true);
    const [token, setToken] = useState("");

    useEffect(() => {
        let token = localStorage.getItem("auth_token");
        if (token) 
            setToken(token);
    }, [])

    useEffect(() => {
        if (!token) return;

        (async () => {
            const res = await getChats(token);
            console.log(`use effect`, res[0])
            setChats(res)
        })()
    }, [])

    const handleNewChat = async () => {
        if (!token) return;
        const chatId = await createNewChat(token);
        setChats((prev) => [{ id: chatId, title: "Untitled" }, ...prev]);
        setChat(chatId);
    }

    return (
        <div className="min-w-60 w-60 bg-stone-50 hidden sm:block h-full overflow-hidden">
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
                        <div key={`${ind}`} onClick={() => setChat(c.id)} className="text-black handlee-regular pl-5 pt-2 line-clamp-1 hover:bg-stone-200 cursor-pointer">
                            {c.title}
                        </div>
                    ))}
                </div>}
            </div>
        </div>
    );
}