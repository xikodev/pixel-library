import { api } from "./api";

type ActiveSession = {
    id: number;
    subject: string;
    startDateTime: string;
    endDateTime: string | null;
    brakeCount: number;
    brakeTime: number;
    studyGroupId?: number | null;
    currentBrakeStartDateTime?: string | null;
};

export async function getActiveSession() {
    const response = await api.get<ActiveSession | null>("/sessions/active");
    return response.data;
}

export async function startSession(subject: string, studyGroupId?: number) {
    const response = await api.post<ActiveSession>("/sessions/start", { subject, studyGroupId });
    return response.data;
}

export async function startBrake(sessionId: number) {
    const response = await api.post(`/sessions/${sessionId}/brake/start`);
    return response.data;
}

export async function endBrake(sessionId: number) {
    const response = await api.post(`/sessions/${sessionId}/brake/end`);
    return response.data;
}

export async function endSession(sessionId: number) {
    const response = await api.post(`/sessions/${sessionId}/end`);
    return response.data;
}
