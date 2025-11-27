import ReactMarkdown from "react-markdown";

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
                    <div className={`${message.role == "user" ? `bg-amber-100 px-3 py-2 rounded prose` : ``}`}>
                        {message.content}
                    </div>
                </div>
            )}  
            {message.role == `assistant` && (
                <div className={`flex justify-start`}>
                    <div className="prose">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                </div>
            )}  
        </div>
    );
}