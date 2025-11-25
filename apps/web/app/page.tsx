import Image, { type ImageProps } from "next/image";
import { Button } from "@repo/ui/button";
import styles from "./page.module.css";
import { GiCutLemon } from "react-icons/gi";
import { AiOutlineWechat } from "react-icons/ai";
import { GoSearch } from "react-icons/go";
import { IoIosArrowDown } from "react-icons/io";

type Props = Omit<ImageProps, "src"> & {
  srcLight: string;
  srcDark: string;
};

const ThemeImage = (props: Props) => {
  const { srcLight, srcDark, ...rest } = props;

  return (
    <>
      <Image {...rest} src={srcLight} className="imgLight" />
      <Image {...rest} src={srcDark} className="imgDark" />
    </>
  );
};

export default function Home() {
  return (
    <div className="flex w-screen h-screen relative">
      <div className="w-64 bg-stone-100 hidden sm:block h-full">
        <div className="flex items-center justify-start gap-2 pl-2 pb-1">
          <GiCutLemon fill="oklch(85.2% 0.199 91.936)" size={40}/>
          <span className="text-3xl pt-2 handlee-regular text-black">Lemon</span>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-start gap-2 pl-5 hover:bg-stone-200 cursor-pointer">
            <AiOutlineWechat fill="oklch(85.2% 0.199 91.936)" size={30} />
            <span className="text-lg pt-2 handlee-regular text-black">New chat</span>
          </div>
          <div className="flex items-center justify-start gap-2 pl-5 hover:bg-stone-200 cursor-pointer">
            <GoSearch fill="oklch(85.2% 0.199 91.936)" size={30} />
            <span className="text-lg pt-2 handlee-regular text-black">Search chats</span>
          </div>
        </div>
        <div className="mt-4">
          <button className="flex items-center justify-start gap-2 pl-5 hover:cursor-pointer">
             <span className="text-lg handlee-regular text-black">Your chats</span>
             <IoIosArrowDown fill="black" size={15} />
          </button>
        </div>
      </div>
      <div className="flex flex-col flex-1 h-full handlee-regular selection:bg-yellow-100">
        <div className="h-12 max-w-full flex justify-between items-center px-2 bg-stone-100">
          <div className="text-black">Lemon</div>
          <button className="bg-yellow-400 text-black w-20 h-4/5 py-2 px-4 rounded-lg cursor-pointer hover:bg-amber-300">Share</button>
        </div>
        <div className="bg-white flex flex-col flex-1 px-40">
          <div className="flex-1 overflow-y-auto">

          </div>
          <div className="h-14 flex items-center gap-2 mb-2 px-1 bg-stone-200 rounded-3xl">
            <input type="text" placeholder="Ask anything" className="bg-white h-4/5 py-2 px-3 flex-1 text-black text-lg rounded-3xl focus:outline-amber-300 focus:outline-solid"></input>
            <button className="bg-yellow-400 text-black w-20 h-4/5 py-2 px-4 rounded-3xl cursor-pointer hover:bg-amber-300">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
