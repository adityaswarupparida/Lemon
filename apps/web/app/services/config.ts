export const BACKEND_URL = process.env.NEXT_PUBLIC_LEMON_BACKEND_URL || "http://localhost:3000";

// Use different token keys for dev vs production to avoid conflicts
export const getAuthTokenKey = () => {
    if (typeof window === "undefined") return "auth_token_prod";
    return window.location.hostname === "localhost" ? "auth_token_dev" : "auth_token_prod";
};
 