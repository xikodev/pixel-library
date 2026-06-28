import { useLocalSearchParams, router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Share, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import {
    approveJoinRequest,
    deleteGroup,
    getGroupDetails,
    GroupDetailsDto,
    rejectJoinRequest,
    removeGroupMember,
} from "@/src/services/groups";
import { QuestCard } from "@/components/quest-card";
import { pixelFontFamily } from "@/src/constants/typography";
import { buildGroupInviteLink } from "@/src/services/group-invites";

export default function GroupDetailsScreen() {
    const params = useLocalSearchParams<{ id: string }>();
    const groupId = useMemo(() => Number(params.id), [params.id]);
    const [group, setGroup] = useState<GroupDetailsDto | null>(null);
    const [loading, setLoading] = useState(false);

    const loadGroup = useCallback(async () => {
        if (!Number.isInteger(groupId)) {
            Alert.alert("Error", "Invalid group id");
            return;
        }

        try {
            setLoading(true);
            const data = await getGroupDetails(groupId);
            setGroup(data);
        } catch (error: any) {
            Alert.alert("Error", error?.response?.data?.message || "Failed to load group");
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useEffect(() => {
        void loadGroup();
    }, [loadGroup]);

    useFocusEffect(
        useCallback(() => {
            void loadGroup();

            const intervalId = setInterval(() => {
                void loadGroup();
            }, 2000);

            return () => clearInterval(intervalId);
        }, [loadGroup])
    );

    async function handleRemoveMember(memberId: number, isAdmin: boolean) {
        if (!group || !group.isAdmin) {
            return;
        }

        if (isAdmin) {
            Alert.alert("Not allowed", "Admin cannot be removed.");
            return;
        }

        try {
            setLoading(true);
            await removeGroupMember(group.id, memberId);
            await loadGroup();
        } catch (error: any) {
            Alert.alert("Error", error?.response?.data?.message || "Failed to remove member");
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteGroup() {
        if (!group || !group.isAdmin) {
            return;
        }

        Alert.alert("Delete group", "Are you sure you want to delete this group?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        setLoading(true);
                        await deleteGroup(group.id);
                        router.replace("/groups");
                    } catch (error: any) {
                        Alert.alert("Error", error?.response?.data?.message || "Failed to delete group");
                    } finally {
                        setLoading(false);
                    }
                },
            },
        ]);
    }

    async function handleShareInviteLink() {
        if (!group) {
            return;
        }

        try {
            const inviteLink = buildGroupInviteLink(group.inviteCode);
            await Share.share({
                message: `Request access to my Pixel Library group "${group.name}" using this invite link: ${inviteLink}\n\nInvite code: ${group.inviteCode}`,
                url: inviteLink,
            });
        } catch {
            Alert.alert("Error", "Failed to share invite link");
        }
    }

    async function handleApproveJoinRequest(personId: number) {
        if (!group?.isAdmin) {
            return;
        }

        try {
            setLoading(true);
            await approveJoinRequest(group.id, personId);
            await loadGroup();
        } catch (error: any) {
            Alert.alert("Error", error?.response?.data?.message || "Failed to approve join request");
        } finally {
            setLoading(false);
        }
    }

    async function handleRejectJoinRequest(personId: number) {
        if (!group?.isAdmin) {
            return;
        }

        try {
            setLoading(true);
            await rejectJoinRequest(group.id, personId);
            await loadGroup();
        } catch (error: any) {
            Alert.alert("Error", error?.response?.data?.message || "Failed to reject join request");
        } finally {
            setLoading(false);
        }
    }

    function openGroupSessionScreen(options?: { subject?: string }) {
        if (!group) {
            return;
        }

        router.push({
            pathname: "/session",
            params: {
                groupId: String(group.id),
                subject: options?.subject,
            },
        });
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }}>
            <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 48 }}>
                <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
                    <Text style={{ color: "#93c5fd", fontSize: 17, fontFamily: pixelFontFamily }}>{"< Back"}</Text>
                </Pressable>

                {!group ? (
                    <QuestCard
                        eyebrow={loading ? "Loading" : "Missing"}
                        title={loading ? "Opening the study hall..." : "This group could not be found"}
                        description={
                            loading
                                ? "Fetching the latest members, invite code, and study room activity."
                                : "It may have been deleted, or you might not have access to it anymore."
                        }
                        accent={loading ? "blue" : "amber"}
                    />
                ) : (
                    <>
                        <Text style={{ color: "#ffffff", fontSize: 32, marginBottom: 8, fontFamily: pixelFontFamily }}>
                            {group.name}
                        </Text>
                        <Text style={{ color: "#9ca3af", fontSize: 16, marginBottom: 4, fontFamily: pixelFontFamily }}>Invite: {group.inviteCode}</Text>
                        <Text style={{ color: group.isAdmin ? "#93c5fd" : "#9ca3af", fontSize: 16, marginBottom: 16, fontFamily: pixelFontFamily }}>
                            {group.isAdmin ? "You are admin" : "You are member"}
                        </Text>

                        <Pressable
                            onPress={handleShareInviteLink}
                            style={{
                                backgroundColor: "#2563eb",
                                borderRadius: 10,
                                paddingVertical: 11,
                                alignItems: "center",
                                marginBottom: 16,
                            }}
                        >
                            <Text style={{ color: "#ffffff", fontSize: 17, fontFamily: pixelFontFamily }}>
                                Share Invite Link
                            </Text>
                        </Pressable>

                        <View style={{ backgroundColor: "#111827", borderRadius: 12, padding: 12, marginBottom: 16 }}>
                            <Text style={{ color: "#93c5fd", fontSize: 18, marginBottom: 8, fontFamily: pixelFontFamily }}>
                                Group Study Session
                            </Text>

                            {group.groupStudy.isActive ? (
                                <>
                                    <Text style={{ color: "#34d399", fontSize: 17, marginBottom: 6, fontFamily: pixelFontFamily }}>
                                        Active now
                                    </Text>
                                    <Text style={{ color: "#9ca3af", fontSize: 16, marginBottom: 10, fontFamily: pixelFontFamily }}>
                                        Studying members: {group.groupStudy.activeCount}
                                    </Text>

                                    {group.groupStudy.participants.map((participant) => (
                                        <View key={participant.sessionId} style={{ marginBottom: 8 }}>
                                            <Text style={{ color: "#ffffff", fontSize: 18, fontFamily: pixelFontFamily }}>
                                                {participant.person.firstName} {participant.person.lastName}
                                            </Text>
                                            <Text style={{ color: "#9ca3af", fontSize: 16, fontFamily: pixelFontFamily }}>@{participant.person.username}</Text>
                                            <Text style={{ color: "#d1d5db", fontSize: 16, fontFamily: pixelFontFamily }}>Subject: {participant.subject}</Text>
                                        </View>
                                    ))}

                                    {!group.groupStudy.hasMyActiveSession ? (
                                        <Pressable
                                            onPress={() =>
                                                openGroupSessionScreen({
                                                    subject: group.groupStudy.participants[0]?.subject || "Group Study",
                                                })
                                            }
                                            style={{
                                                backgroundColor: "#059669",
                                                borderRadius: 10,
                                                paddingVertical: 11,
                                                alignItems: "center",
                                            }}
                                        >
                                            <Text style={{ color: "#ffffff", fontSize: 18, fontFamily: pixelFontFamily }}>Join</Text>
                                        </Pressable>
                                    ) : (
                                        <Pressable
                                            onPress={() => openGroupSessionScreen()}
                                            style={{
                                                backgroundColor: "#2563eb",
                                                borderRadius: 10,
                                                paddingVertical: 11,
                                                alignItems: "center",
                                            }}
                                        >
                                            <Text style={{ color: "#ffffff", fontSize: 18, fontFamily: pixelFontFamily }}>Continue</Text>
                                        </Pressable>
                                    )}
                                </>
                            ) : (
                                <>
                                    <QuestCard
                                        eyebrow="Quiet Room"
                                        title="No one is studying here yet"
                                        description="Start the next group session and your friends will be able to join your table."
                                        accent="green"
                                    >
                                        <Pressable
                                            onPress={() => openGroupSessionScreen()}
                                            style={{
                                                backgroundColor: "#2563eb",
                                                borderRadius: 10,
                                                paddingVertical: 11,
                                                alignItems: "center",
                                            }}
                                        >
                                            <Text style={{ color: "#ffffff", fontSize: 18, fontFamily: pixelFontFamily }}>
                                                Start Group Study
                                            </Text>
                                        </Pressable>
                                    </QuestCard>
                                </>
                            )}
                        </View>

                        {group.isAdmin && group.pendingRequests.length > 0 ? (
                            <View style={{ backgroundColor: "#111827", borderRadius: 12, padding: 12, marginBottom: 16 }}>
                                <Text style={{ color: "#fcd34d", fontSize: 18, marginBottom: 10, fontFamily: pixelFontFamily }}>
                                    Join Requests ({group.pendingRequests.length})
                                </Text>

                                {group.pendingRequests.map((request) => (
                                    <View
                                        key={request.id}
                                        style={{ backgroundColor: "#0f172a", borderRadius: 12, padding: 12, marginBottom: 10 }}
                                    >
                                        <Text style={{ color: "#ffffff", fontSize: 18, fontFamily: pixelFontFamily }}>
                                            {request.firstName} {request.lastName}
                                        </Text>
                                        <Text style={{ color: "#9ca3af", fontSize: 16, marginTop: 2, fontFamily: pixelFontFamily }}>
                                            @{request.username}
                                        </Text>
                                        <Text style={{ color: "#9ca3af", fontSize: 16, marginBottom: 10, fontFamily: pixelFontFamily }}>
                                            {request.email}
                                        </Text>

                                        <Pressable
                                            onPress={() => handleApproveJoinRequest(request.id)}
                                            disabled={loading}
                                            style={{
                                                backgroundColor: "#059669",
                                                borderRadius: 10,
                                                paddingVertical: 10,
                                                alignItems: "center",
                                                marginBottom: 8,
                                            }}
                                        >
                                            <Text style={{ color: "#ffffff", fontSize: 17, fontFamily: pixelFontFamily }}>
                                                Approve Request
                                            </Text>
                                        </Pressable>

                                        <Pressable
                                            onPress={() => handleRejectJoinRequest(request.id)}
                                            disabled={loading}
                                            style={{
                                                backgroundColor: "#7f1d1d",
                                                borderRadius: 10,
                                                paddingVertical: 10,
                                                alignItems: "center",
                                            }}
                                        >
                                            <Text style={{ color: "#ffffff", fontSize: 17, fontFamily: pixelFontFamily }}>
                                                Reject Request
                                            </Text>
                                        </Pressable>
                                    </View>
                                ))}
                            </View>
                        ) : null}

                        {group.isAdmin ? (
                            <Pressable
                                onPress={handleDeleteGroup}
                                disabled={loading}
                                style={{
                                    backgroundColor: "#991b1b",
                                    borderRadius: 12,
                                    paddingVertical: 12,
                                    alignItems: "center",
                                    marginBottom: 16,
                                }}
                            >
                                <Text style={{ color: "#ffffff", fontSize: 18, fontFamily: pixelFontFamily }}>Delete Group</Text>
                            </Pressable>
                        ) : null}

                        <Text style={{ color: "#93c5fd", fontSize: 18, marginBottom: 10, fontFamily: pixelFontFamily }}>
                            Members ({group.members.length})
                        </Text>

                        {group.members.map((member) => (
                            <View
                                key={member.id}
                                style={{ backgroundColor: "#111827", borderRadius: 12, padding: 12, marginBottom: 10 }}
                            >
                                <Text style={{ color: "#ffffff", fontSize: 18, fontFamily: pixelFontFamily }}>
                                    {member.firstName} {member.lastName}
                                </Text>
                                <Text style={{ color: "#9ca3af", fontSize: 16, marginTop: 2, fontFamily: pixelFontFamily }}>@{member.username}</Text>
                                <Text style={{ color: "#9ca3af", fontSize: 16, marginBottom: 8, fontFamily: pixelFontFamily }}>{member.email}</Text>
                                <Text style={{ color: member.isAdmin ? "#93c5fd" : "#9ca3af", fontSize: 16, marginBottom: 8, fontFamily: pixelFontFamily }}>
                                    {member.isAdmin ? "Admin" : "Member"}
                                </Text>

                                {group.isAdmin && !member.isAdmin ? (
                                    <Pressable
                                        onPress={() => handleRemoveMember(member.id, member.isAdmin)}
                                        disabled={loading}
                                        style={{
                                            backgroundColor: "#7f1d1d",
                                            borderRadius: 10,
                                            paddingVertical: 10,
                                            alignItems: "center",
                                        }}
                                    >
                                        <Text style={{ color: "#ffffff", fontSize: 17, fontFamily: pixelFontFamily }}>
                                            Remove Member
                                        </Text>
                                    </Pressable>
                                ) : null}
                            </View>
                        ))}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
