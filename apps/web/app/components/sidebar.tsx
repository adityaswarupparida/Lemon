"use client"
import { GiCutLemon } from "react-icons/gi";
import { AiOutlineWechat } from "react-icons/ai";
import { GoSearch } from "react-icons/go";
import { IoIosArrowDown } from "react-icons/io";
import { useContext, useEffect, useState } from "react";
import { getChats } from "../services/chat";
import { ChatContext } from "../providers/chatContext";

export const Sidebar = () => {
    const ctx = useContext(ChatContext);
    if (!ctx) return null;
    const { chat } = ctx;
    const [chats, setChats] = useState<any[]>([]);

    useEffect(() => {
        (async () => {
            const res = await getChats();
            console.log(`use effect`, res[0])
            setChats(res)
        })()
    }, [])

    return (
        <div className="w-64 bg-stone-100 hidden sm:block h-full overflow-y-hidden">
            <div className="flex items-center justify-start gap-2 pl-2 pb-1">
                <GiCutLemon fill="oklch(85.2% 0.199 91.936)" size={40}/>
                <span className="text-3xl pt-2 handlee-regular text-black">Lemon</span>
            </div>
            <div className="mt-3 flex flex-col">
                <button className="flex items-center justify-start gap-2 pl-5 hover:bg-stone-200 cursor-pointer">
                    <AiOutlineWechat fill="oklch(85.2% 0.199 91.936)" size={30} />
                    <span className="text-lg pt-2 handlee-regular text-black">New chat</span>
                </button>
                <div className="flex items-center justify-start gap-2 pl-5 hover:bg-stone-200 cursor-pointer">
                    <GoSearch fill="oklch(85.2% 0.199 91.936)" size={30} />
                    <span className="text-lg pt-2 handlee-regular text-black">Search chats</span>
                </div>
            </div>
            <div className="mt-4 overflow-y-auto">
                <button className="flex items-center justify-start gap-2 pl-5 hover:cursor-pointer">
                    <span className="text-lg handlee-regular text-black">Your chats</span>
                    <IoIosArrowDown fill="black" size={15} />
                </button>
                {chats && <div>
                    {chats.map((c, ind) => (
                        <div key={`${ind}`} className="text-black handlee-regular pl-5 pt-2 hover:bg-stone-200 cursor-pointer">
                            {c.title}
                        </div>
                    ))}
                </div>}
            </div>
        </div>
    );
}