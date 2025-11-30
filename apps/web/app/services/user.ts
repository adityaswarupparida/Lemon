import axios from "axios";
import { BACKEND_URL } from "./config";
import { SignUpInput } from "../(auth)/signup/page";
import { SignInInput } from "../(auth)/signin/page";

export const signUp = async (input: SignUpInput) => {
    try {
        const response = await axios.post(`${BACKEND_URL}/api/user/signup`, {
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            password: input.password
        });

        console.log(response.data.user);
        return { 
            token: response.data.token 
        };
    } catch (err) {
        console.log(err);
        if (axios.isAxiosError(err)) {
            return { 
                error: err.response?.data.message 
            };
        }
        
        return { error: "Unexpected error" };
    }
    
}

export const signIn = async (input: SignInInput) => {
    try {
        const response = await axios.post(`${BACKEND_URL}/api/user/signin`, {
            username: input.email,
            password: input.password
        });

        return {
            token: response.data.token
        };
    } catch (err) {
        console.log(err);
        if (axios.isAxiosError(err)) {
            return { 
                error: err.response?.data.message 
            };
        }
        
        return { error: "Unexpected error" };
    }
}