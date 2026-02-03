export type User = {
    firstName: string;
    lastName: string;
    email: string;
}

export type ChatItem = {
    id: string;
    title: string
}

export type SearchResult = {
    chatId: string;
    title: string;
    snippet: string;
};