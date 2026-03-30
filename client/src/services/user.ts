import { api } from "./api";

export type MeDto = {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    character: number;
    totalTimeStudied: number;
    totalBrakeTime: number;
    totalBrakes: number;
};

export type UpdateMePayload = {
    username?: string;
    firstName?: string;
    lastName?: string;
    character?: number;
    email?: string;
    password?: string;
};

export async function getMe() {
    const response = await api.get<MeDto>("/users/me");
    return response.data;
}

export async function updateMe(payload: UpdateMePayload) {
    const response = await api.patch<MeDto>("/users/me", payload);
    return response.data;
}

export async function deleteMe() {
    const response = await api.delete("/users/me");
    return response.data;
}
