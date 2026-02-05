import { memo } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import { CodeBlock } from "./ui/codeBlock";

export type Message = {
    id: number;
    content: string;
    role: "user" | "assistant";
}

// Memoized markdown components to prevent re-renders
const markdownComponents: Components = {
    code({ className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || "");
        const isInline = !match && !className;

        if (isInline) {
            return (
                <code className="bg-stone-100 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                    {children}
                </code>
            );
        }

        return (
            <CodeBlock
                language={match?.[1] ?? "text"}
                code={String(children).replace(/\n$/, "")}
            />
        );
    },
};

export const MessageBubble = memo(({ message, loading } : { message: Message, loading: boolean }) => {
    return (
        <div className="mt-2">
            {message.role == `user` && (
                <div className={`flex justify-end items-center`}>
                    <div className={`${message.role == "user" ? `bg-amber-100 px-3 py-2 rounded prose selection:bg-white!` : ``}`}>
                        {message.content}
                    </div>
                </div>
            )}
            {message.role == `assistant` && (
                <div className={`flex justify-start`}>
                    <div className="prose">
                        <ReactMarkdown components={markdownComponents}>
                            {parseMessage(message.content)}
                        </ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    );
});

const parseMessage = (message: string) => {
    let str = "";
    let index = 0;

    while (true) {
        const startOpenTag = message.indexOf("<artifact", index);
        if (startOpenTag == -1) {
            str += message.slice(index);
            break;
        }
        if (index < startOpenTag) {
            str += message.slice(index, startOpenTag);
        }
        const endOpenTag = message.indexOf(">", startOpenTag);
        if (endOpenTag == -1) {
            break;
        }

        const startCloseTag = message.indexOf("</artifact", endOpenTag);
        if (startCloseTag == -1) {
            break;
        }
        str += message.slice(endOpenTag, startCloseTag);

        const endCloseTag = message.indexOf(">", startCloseTag);
        if (endCloseTag == -1) {
            break;
        }
        index = endCloseTag;
    }
    return str;
}
