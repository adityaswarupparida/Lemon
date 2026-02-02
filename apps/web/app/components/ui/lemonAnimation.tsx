import { GiCutLemon } from "react-icons/gi";

type LemonSize = "sm" | "md" | "lg" | "xl";

const sizeConfig = {
    sm: {
        icon: "w-6 h-6",
        dropTop: "top-4",
        drops: [
            { left: "left-2", size: "w-1 h-1.5" },
            { left: "left-1", size: "w-1 h-1.5" },
            { left: "left-3", size: "w-0.5 h-1" },
        ],
    },
    md: {
        icon: "w-8 h-8",
        dropTop: "top-6",
        drops: [
            { left: "left-3", size: "w-1.5 h-2" },
            { left: "left-1.5", size: "w-1.5 h-2" },
            { left: "left-4", size: "w-1 h-1.5" },
        ],
    },
    lg: {
        icon: "w-10 h-10",
        dropTop: "top-7",
        drops: [
            { left: "left-3.5", size: "w-1.5 h-2.5" },
            { left: "left-2", size: "w-1.5 h-2.5" },
            { left: "left-4.5", size: "w-1 h-2" },
        ],
    },
    xl: {
        icon: "w-12 h-12",
        dropTop: "top-8",
        drops: [
            { left: "left-4", size: "w-2 h-3" },
            { left: "left-2", size: "w-2 h-3" },
            { left: "left-5", size: "w-1.5 h-2.5" },
        ],
    },
};

export const LemonAnimation = ({ size = "xl" }: { size?: LemonSize }) => {
    const config = sizeConfig[size];

    return (
        <div className="flex items-center justify-center">
            <div className="relative">
                <GiCutLemon
                    className={`${config.icon} transition-all duration-300 text-amber-300 animate-squeeze`}
                />
                <>
                    <div className={`absolute ${config.dropTop} ${config.drops[0]?.left} animate-drop-1`}>
                        <div className={`${config.drops[0]?.size} bg-yellow-400 rounded-full opacity-80`}></div>
                    </div>
                    <div className={`absolute ${config.dropTop} ${config.drops[1]?.left} animate-drop-2`}>
                        <div className={`${config.drops[1]?.size} bg-yellow-400 rounded-full opacity-80`}></div>
                    </div>
                    <div className={`absolute ${config.dropTop} ${config.drops[2]?.left} animate-drop-3`}>
                        <div className={`${config.drops[2]?.size} bg-yellow-400 rounded-full opacity-80`}></div>
                    </div>
                </>
            </div>
        </div>
    );
};