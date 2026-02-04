"use client"
import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { IoCopyOutline, IoCheckmark } from "react-icons/io5";

type CodeBlockProps = {
    language: string;
    code: string;
};

export const CodeBlock = ({ language, code }: CodeBlockProps) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    return (
        <div className="rounded-lg overflow-hidden my-4 bg-[#282c34] text-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#21252b] border-b border-[#181a1f]">
                <span className="text-stone-400 text-xs font-mono">{language}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-stone-400 hover:text-white transition-colors text-xs"
                >
                    {copied ? (
                        <>
                            <IoCheckmark size={14} />
                            <span>Copied!</span>
                        </>
                    ) : (
                        <>
                            <IoCopyOutline size={14} />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>
            {/* Code */}
            <SyntaxHighlighter
                language={language}
                style={oneDark}
                customStyle={{
                    margin: 0,
                    padding: "1rem",
                    background: "transparent",
                    fontSize: "0.875rem",
                }}
                codeTagProps={{
                    style: {
                        fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
                    }
                }}
            >
                {code.trim()}
            </SyntaxHighlighter>
        </div>
    );
};
