import z from "zod";

export const UserSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    password: z.string()
});

export const ChatSchema = z.object({
    title: z.string()
});

export const MessageSchema = z.object({

});

