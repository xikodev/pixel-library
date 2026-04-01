import * as SecureStore from "expo-secure-store";

const ACTIVE_SESSION_KEY = "pixel_library_active_session";

export type StoredSession = {
    id: number;
    subject: string;
    startDateTime: string;
    brakeCount: number;
    brakeTime: number;
    studyGroupId?: number | null;
};

type StoredActiveSessionState = {
    session: StoredSession;
    onBreak: boolean;
    brakeStartedAt: number | null;
};

export async function getStoredActiveSession() {
    const raw = await SecureStore.getItemAsync(ACTIVE_SESSION_KEY);
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as StoredActiveSessionState;
    } catch {
        return null;
    }
}

export async function setStoredActiveSession(value: StoredActiveSessionState) {
    return SecureStore.setItemAsync(ACTIVE_SESSION_KEY, JSON.stringify(value));
}

export async function clearStoredActiveSession() {
    return SecureStore.deleteItemAsync(ACTIVE_SESSION_KEY);
}
