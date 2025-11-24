import Image, { type ImageProps } from "next/image";
import { Button } from "@repo/ui/button";
import styles from "./page.module.css";

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
    <div className="flex bg-red-400 relative">
      <div className="w-64 bg-orange-300 h-screen">

      </div>
      <div className="flex flex-col flex-1">
        <div className="bg-yellow-300 h-12 flex justify-between">
          <div>Jagannath</div>
          <div>Jagannath</div>
        </div>
        <div className="bg-yellow-100 flex flex-col flex-1 overflow-x-hidden">
          <div className="bg-amber-400 flex-1 overflow-y-auto"></div>
          <div className="bg-amber-200 h-14 flex items-center gap-2">
            <input type="text" placeholder="Ask anything" className="bg-white h-4/5 flex-1"></input>
            <button className="bg-black w-20 h-4/5 rounded-lg">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
