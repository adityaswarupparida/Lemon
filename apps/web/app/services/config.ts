export const BACKEND_URL = process.env.NEXT_PUBLIC_LEMON_BACKEND_URL || "http://localhost:3002";

// Use different token keys for dev vs production to avoid conflicts
export const getAuthTokenKey = () => {
    if (typeof window === "undefined") return "auth_token_prod";
    const isLocalDev = ["localhost", "127.0.0.1", "0.0.0.0"].includes(window.location.hostname) 
                        || window.location.hostname.endsWith(".local");
    return isLocalDev ? "auth_token_dev" : "auth_token_prod";
};
 