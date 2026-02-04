import ReactMarkdown from "react-markdown";
import { CodeBlock } from "./ui/codeBlock";

export type Message = {
    id: number;
    content: string;
    role: "user" | "assistant";
}

export const MessageBubble = ({ message, loading } : { message: Message, loading: boolean }) => {
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
                    <div className="prose prose-stone">
                        <ReactMarkdown
                            components={{
                                code({ className, children, ...props }) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    const codeString = String(children).replace(/\n$/, '');

                                    // Check if it's a code block (has language) vs inline code
                                    if (match && match[1]) {
                                        return <CodeBlock language={match[1]} code={codeString} />;
                                    }

                                    // Inline code
                                    return (
                                        <code className="bg-stone-100 text-stone-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                                            {children}
                                        </code>
                                    );
                                },
                                // Style pre to not add extra styling (CodeBlock handles it)
                                pre({ children }) {
                                    return <>{children}</>;
                                }
                            }}
                        >
                            {parseMessage(message.content)}
                        </ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    );
}

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