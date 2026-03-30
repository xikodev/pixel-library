import { api } from "./api";

type SignupPayload = {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    character: number;
};

type LoginPayload = {
    identifier: string;
    password: string;
};

export async function signup(payload: SignupPayload) {
    const response = await api.post("/auth/signup", payload);
    return response.data;
}

export async function login(payload: LoginPayload) {
    const response = await api.post("/auth/login", payload);
    return response.data;
}
