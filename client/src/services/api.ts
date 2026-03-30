import axios from "axios";
import { getToken } from "./token";

function normalizeApiBaseUrl(value: string) {
    return value.replace(/\/+$/, "");
}

const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const API_BASE_URL = normalizeApiBaseUrl(configuredApiBaseUrl || "http://localhost:3000/api");

export const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});

api.interceptors.request.use(async (config) => {
    const token = await getToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export { API_BASE_URL };
