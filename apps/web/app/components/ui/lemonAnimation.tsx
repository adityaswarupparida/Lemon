import { GiCutLemon } from "react-icons/gi";

export const LemonAnimation = () => {
    return (
        <div className="flex items-center justify-center mb-8 h-32">
            <div className="relative">
                {/* Lemon */}
                <GiCutLemon
                className={`w-12 h-12 transition-all duration-300 text-amber-300 animate-squeeze`}
                />
                
                {/* Juice drops - only show when animating */}
                <>
                    <div className="absolute top-8 left-4 animate-drop-1">
                    <div className="w-2 h-3 bg-yellow-400 rounded-full opacity-80"></div>
                    </div>
                    <div className="absolute top-8 left-2 animate-drop-2">
                    <div className="w-2 h-3 bg-yellow-400 rounded-full opacity-80"></div>
                    </div>
                    <div className="absolute top-8 left-5 animate-drop-3">
                    <div className="w-1.5 h-2.5 bg-yellow-400 rounded-full opacity-80"></div>
                    </div>
                </>
            </div>
        </div>
    );
    
}