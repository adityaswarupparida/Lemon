import { GiCutLemon } from "react-icons/gi";

export const Home = () => {
    
    return (
        <div className="flex flex-col justify-between items-center bg-yellow-50 w-full text-black handlee-regular border-l-2 border-l-amber-100">
            <div className="flex flex-col justify-center items-center w-full grow">
                <div className="flex flex-col justify-center items-center text-9xl w-full">
                    <div>
                        <div className="animate-typing overflow-hidden whitespace-nowrap border-r-4 border-r-black">
                            Hi, Welcome to  
                        </div>
                    </div>
                    <div className="flex">
                        Lem
                        <div className="flex flex-col items-start mt-2">
                            <GiCutLemon
                                className={`w-24 h-24 transition-all duration-300 text-amber-300 animate-squeeze`}
                            />
                        </div>
                        n
                    </div> 
                </div>
                <div className="mt-16 text-4xl kedebideri-medium">
                    Your Everyday AI Assistant. Built for Everyone.
                </div>
                <div className="flex flex-col text-xl gap-1 items-center mt-16">
                    <div className="flex gap-2">
                        Feeling zesty? Start chatting with
                        <GiCutLemon
                            className={`w-6 h-6 transition-all duration-300 text-amber-300 animate-squeeze`}
                        /> in New Chat.
                    </div>
                    <div className="flex gap-2 relative">
                        <GiCutLemon
                            className={`w-6 h-6 transition-all duration-300 text-amber-300 animate-squeeze`}
                        />
                        <>
                            <div className="absolute top-4 left-2 animate-drop-1">
                            <div className="w-1 h-1.5 bg-yellow-400 rounded-full opacity-80"></div>
                            </div>
                            <div className="absolute top-4 left-1 animate-drop-2">
                            <div className="w-1 h-1.5 bg-yellow-400 rounded-full opacity-80"></div>
                            </div>
                            <div className="absolute top-4 left-3 animate-drop-3">
                            <div className="w-0.75 h-1.25 bg-yellow-400 rounded-full opacity-80"></div>
                            </div>
                        </> 
                       Squeezed a chat earlier and want to finish it? Jump into <span className="">Your Chats</span> and continue from where you paused. 
                    </div>
                </div>
            </div>
            <div className="h-10">
                Squeezed with love by Lemonista 🍋❤️ · 2025
            </div>
        </div>
    );
}