import axios from "axios";
import { BACKEND_URL } from "./config";
import { SignUpInput } from "../(auth)/signup/page";
import { SignInInput } from "../(auth)/signin/page";

export const signUp = async (input: SignUpInput) => {
    const response = await axios.post(`${BACKEND_URL}/api/user/signup`, {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        password: input.password
    });

    if (response.status != 200)
        return { 
            error: response.data.message 
        };

    console.log(response.data.user);
    return { 
        token: response.data.token 
    };
}

export const signIn = async (input: SignInInput) => {
    const response = await axios.post(`${BACKEND_URL}/api/user/signin`, {
        username: input.email,
        password: input.password
    });

    if (response.status != 200)
        return response.data.message;

    return response.data.token;
}