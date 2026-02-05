"use client"
import { memo, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vs } from "react-syntax-highlighter/dist/esm/styles/prism";
import { IoCopyOutline, IoCheckmark } from "react-icons/io5";

type CodeBlockProps = {
    language: string;
    code: string;
};

export const CodeBlock = memo(({ language, code }: CodeBlockProps) => {
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
        <div className="rounded-lg overflow-hidden border border-stone-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-stone-100 border-b border-stone-200">
                <span className="text-sm text-stone-600 font-mono">{language || "code"}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-stone-500 hover:text-stone-700 transition-colors cursor-pointer handlee-regular"
                    title="Copy code"
                >
                    {copied ? (
                        <>
                            <IoCheckmark size={16} className="text-green-600" />
                            <span className="text-xs text-green-600">Copied!</span>
                        </>
                    ) : (
                        <>
                            <IoCopyOutline size={16} />
                            <span className="text-xs">Copy</span>
                        </>
                    )}
                </button>
            </div>
            {/* Code */}
            <div className="bg-stone-50 overflow-x-auto">
                <SyntaxHighlighter
                    language={language}
                    style={vs}
                    customStyle={{
                        margin: 0,
                        padding: "1rem 2rem",
                        fontSize: "0.875rem",
                        border: "none",
                    }}
                    codeTagProps={{
                        style: {
                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                            background: "transparent",
                        }
                    }}
                >
                    {code.trim()}
                </SyntaxHighlighter>
            </div>
        </div>
    );
});
