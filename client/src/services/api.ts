import Constants from "expo-constants";
import axios, { isAxiosError } from "axios";
import { getToken } from "./token";

function normalizeApiBaseUrl(value: string) {
    return value.replace(/\/+$/, "");
}

function extractHost(candidate?: string | null) {
    if (!candidate) {
        return null;
    }

    const sanitizedCandidate = candidate.replace(/^https?:\/\//, "").split("/")[0];
    const [host] = sanitizedCandidate.split(":");

    return host || null;
}

function inferExpoDevApiBaseUrl() {
    const candidates = [
        Constants.expoConfig?.hostUri,
        Constants.expoGoConfig?.debuggerHost,
        Constants.manifest2?.extra?.expoClient?.hostUri,
        Constants.manifest?.debuggerHost,
    ];

    for (const candidate of candidates) {
        const host = extractHost(candidate);

        if (host) {
            return `http://${host}:3000/api`;
        }
    }

    return null;
}

const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const inferredDevApiBaseUrl = __DEV__ ? inferExpoDevApiBaseUrl() : null;
const API_BASE_URL = normalizeApiBaseUrl(inferredDevApiBaseUrl || configuredApiBaseUrl || "http://localhost:3000/api");

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

export function getApiErrorMessage(error: unknown, fallbackMessage: string) {
    if (!isAxiosError(error)) {
        return fallbackMessage;
    }

    const responseMessage = error.response?.data?.message;
    if (typeof responseMessage === "string" && responseMessage.trim()) {
        return responseMessage;
    }

    if (error.code === "ECONNABORTED") {
        return `Request to ${API_BASE_URL} timed out. Check that the API is running and reachable from your phone.`;
    }

    if (!error.response) {
        return `Could not reach the API at ${API_BASE_URL}. Check your laptop IP, firewall, and that Expo is running in LAN mode.`;
    }

    return fallbackMessage;
}

export { API_BASE_URL };
