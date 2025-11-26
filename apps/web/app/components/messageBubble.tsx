export type Message = {
    id: number; 
    content: string;
    role: "user" | "assistant";
}

export const MessageBubble = ({ message, loading } : { message: Message, loading: boolean }) => {
    return (
        <div className={`${message.role == `user` ? `flex justify-end items-center` : `flex justify-start`} mt-2`}>
            <div className={`${message.role == "user" ? `bg-amber-100 px-3 py-2 rounded` : ``}`}>
                {message.content}
            </div>
        </div>    
    );
}