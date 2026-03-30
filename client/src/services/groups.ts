import { api } from "./api";

export type GroupDto = {
    id: number;
    name: string;
    inviteCode: string;
    adminId: number;
    isAdmin: boolean;
    memberCount: number;
    hasActiveGroupSession: boolean;
};

export type GroupMemberDto = {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    isAdmin: boolean;
};

export type GroupDetailsDto = {
    id: number;
    name: string;
    inviteCode: string;
    adminId: number;
    isAdmin: boolean;
    groupStudy: GroupStudyStatusDto;
    members: GroupMemberDto[];
};

export type GroupStudyStatusDto = {
    isActive: boolean;
    activeCount: number;
    hasMyActiveSession: boolean;
    participants: {
        sessionId: number;
        subject: string;
        startDateTime: string;
        personId: number;
        person: {
            id: number;
            username: string;
            firstName: string;
            lastName: string;
            character: number;
        };
    }[];
};

export async function getMyGroups() {
    const response = await api.get<GroupDto[]>("/groups/me");
    return response.data;
}

export async function createGroup(name: string) {
    const response = await api.post("/groups", { name });
    return response.data;
}

export async function joinByCode(code: string) {
    const response = await api.post(`/groups/join/${code}`);
    return response.data;
}

export async function getGroupDetails(groupId: number) {
    const response = await api.get<GroupDetailsDto>(`/groups/${groupId}`);
    return response.data;
}

export async function removeGroupMember(groupId: number, personId: number) {
    const response = await api.delete(`/groups/${groupId}/members/${personId}`);
    return response.data;
}

export async function deleteGroup(groupId: number) {
    const response = await api.delete(`/groups/${groupId}`);
    return response.data;
}
