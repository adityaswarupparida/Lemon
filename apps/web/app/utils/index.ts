export const concatenate = (word1: string | undefined, word2: string | undefined, sep: string) => {
    if (!word1 || !word2) return "";
    return word1 + sep + word2;
}

export const getInitials = (word1: string | undefined, word2: string | undefined) => {
    if (!word1 || !word2) return "";
    return concatenate(word1[0].toUpperCase(), word2[0].toUpperCase(), "");
}