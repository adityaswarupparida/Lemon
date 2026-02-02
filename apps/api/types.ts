import z from "zod";

export const UserSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.email(),
    password: z.string().min(6)
});

export const ChatSchema = z.object({
    title: z.string()
});

export const MessageSchema = z.object({

});

