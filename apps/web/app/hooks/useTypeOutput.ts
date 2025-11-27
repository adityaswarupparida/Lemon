import { useEffect, useRef, useState } from "react";

export const useTypeOutput = (output: string) => {
    const [typedOutput, setTypedOutput] = useState("");
    const typingRef = useRef(false);

    useEffect(() => {
        if (!output) return;
        if (typingRef.current) return; // prevent multiple loops

        typingRef.current = true;

        let i = 0;

        const type = () => {
            // If new chunk arrives while typing
            if (i < output.length) {
                setTypedOutput(output.slice(0, i + 1));
                i++;
                setTimeout(type, 15); // typing speed (ms)
            } else {
                typingRef.current = false;
            }
        };

        type();
    }, [output]);

    return { typedOutput };
}