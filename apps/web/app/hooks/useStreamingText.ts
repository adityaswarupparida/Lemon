import { useCallback, useEffect, useRef, useState } from "react";

export const useStreamingText = (speed: number = 20) => {
    const [displayedText, setDisplayedText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const queueRef = useRef<string>("");
    const currentIndexRef = useRef(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const startTyping = useCallback(() => {
        if (intervalRef.current) return;

        setIsTyping(true);
        intervalRef.current = setInterval(() => {
            if (currentIndexRef.current < queueRef.current.length) {
                currentIndexRef.current++;
                setDisplayedText(queueRef.current.slice(0, currentIndexRef.current));
            } else {
                // Caught up with the queue, wait for more
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
                setIsTyping(false);
            }
        }, speed);
    }, [speed]);

    const addChunk = useCallback((chunk: string) => {
        queueRef.current += chunk;
        if (!intervalRef.current) {
            startTyping();
        }
    }, [startTyping]);

    const reset = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        queueRef.current = "";
        currentIndexRef.current = 0;
        setDisplayedText("");
        setIsTyping(false);
    }, []);

    const finishImmediately = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setDisplayedText(queueRef.current);
        currentIndexRef.current = queueRef.current.length;
        setIsTyping(false);
    }, []);

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    return {
        displayedText,
        isTyping,
        addChunk,
        reset,
        finishImmediately,
        fullText: queueRef.current
    };
};
