"use client"
import Link from 'next/link'
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GiCutLemon } from "react-icons/gi";
import { Toaster, toast } from 'sonner';
import { signIn } from '../../services/user';

export type SignInInput = {
    email: string;
    password: string;
}

export default function SignIn() {
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(false);
    const [input, setInput] = useState<SignInInput>({
        email: "",
        password: "",
    });

    const handleChange = (field: keyof SignInInput, value: string) => {
        setInput(prev => ({ ...prev, [field]: value }));
    }

    const isValid = input.email && input.password;
    
    const handleClick = () => {
        setLoading(true);

        // make api call
        (async () => {
            const { error, token } = await signIn(input);
            if (error) {
                toast.error("Error while signing in: "+error);
                return;
            }
            localStorage.setItem("auth_token", token);
            toast.success("You are signed in.");
        })()

        setTimeout(() => {
            setInput({
                email: "",
                password: "",
            });
            setLoading(false);
            router.push("/");
        }, 1000);
    }

    return (
        <div className="flex items-center justify-center w-screen h-screen bg-amber-100">
            <div className="w-[500px] bg-white text-black rounded-2xl shadow-2xl">
                <div className="flex flex-col justify-center gap-2 handlee-regular w-full p-10">
                    <div className="flex flex-col gap-1 justify-center items-center p-2">
                        <div className="text-4xl flex items-center gap-2">
                            <div className="tracking-tight">Welcome Back</div>
                            <div>
                                <GiCutLemon
                                    className={`w-12 h-12 pb-2 transition-all duration-300 text-amber-300 hover:animate-squeeze`}
                                />
                            </div>
                        </div>
                        <div className="text-xl text-black/50">Time for another burst of Lemon energy</div>
                    </div>
                    <div className="flex mb-2">
                        <input type="text" placeholder="Email" required
                            className="p-2 flex-1 border border-stone-100 focus:outline-solid focus:outline-2 rounded outline-amber-200"
                            value={input.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                            onKeyDown={(e) => isValid && e.key === "Enter" && handleClick()} 
                        ></input>
                    </div>
                    <div className="flex mb-2">
                        <input type="password" placeholder="Password" required
                            className="p-2 flex-1 border border-stone-100 focus:outline-solid focus:outline-2 rounded outline-amber-200"
                            value={input.password}
                            onChange={(e) => handleChange("password", e.target.value)}
                            onKeyDown={(e) => isValid && e.key === "Enter" && handleClick()}
                        ></input>
                    </div>
                    <div className="mb-2 flex flex-col justify-center items-center gap-1 w-full">
                        <button className="bg-amber-300 w-full p-2 rounded hover:bg-yellow-400 cursor-pointer disabled:bg-amber-300/50 disabled:cursor-not-allowed"
                            disabled={!isValid || loading}
                            onClick={handleClick}
                        >
                            {loading && <div className="flex justify-center py-1">
                                <svg className="w-5 h-5 text-white animate-spin" fill="none"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        fill="currentColor"></path>
                                </svg>
                            </div>}
                            {!loading && `Sign In`}
                        </button>
                        <div className="text-sm">Don't have an account ? {` `} 
                            <span className="text-amber-500 hover:underline cursor-pointer"><Link href={"/signup"}>Sign up</Link></span>
                        </div>
                    </div>
                </div>
            </div>
            <Toaster 
                position="top-right"
                richColors 
            />
        </div>
    );
}