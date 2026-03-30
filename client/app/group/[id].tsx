import { useLocalSearchParams, router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { deleteGroup, getGroupDetails, GroupDetailsDto, removeGroupMember } from "@/src/services/groups";

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
                    <Text style={{ color: "#93c5fd" }}>{"< Back"}</Text>
                </Pressable>

                {!group ? (
                    <Text style={{ color: "#9ca3af" }}>{loading ? "Loading..." : "Group not found."}</Text>
                ) : (
                    <>
                        <Text style={{ color: "#ffffff", fontSize: 28, fontWeight: "700", marginBottom: 8 }}>{group.name}</Text>
                        <Text style={{ color: "#9ca3af", marginBottom: 4 }}>Invite: {group.inviteCode}</Text>
                        <Text style={{ color: group.isAdmin ? "#93c5fd" : "#9ca3af", marginBottom: 16 }}>
                            {group.isAdmin ? "You are admin" : "You are member"}
                        </Text>

                        <View style={{ backgroundColor: "#111827", borderRadius: 12, padding: 12, marginBottom: 16 }}>
                            <Text style={{ color: "#93c5fd", fontWeight: "700", marginBottom: 8 }}>Group Study Session</Text>

                            {group.groupStudy.isActive ? (
                                <>
                                    <Text style={{ color: "#34d399", fontWeight: "700", marginBottom: 6 }}>Active now</Text>
                                    <Text style={{ color: "#9ca3af", marginBottom: 10 }}>
                                        Studying members: {group.groupStudy.activeCount}
                                    </Text>

                                    {group.groupStudy.participants.map((participant) => (
                                        <View key={participant.sessionId} style={{ marginBottom: 8 }}>
                                            <Text style={{ color: "#ffffff", fontWeight: "600" }}>
                                                {participant.person.firstName} {participant.person.lastName}
                                            </Text>
                                            <Text style={{ color: "#9ca3af" }}>@{participant.person.username}</Text>
                                            <Text style={{ color: "#d1d5db" }}>Subject: {participant.subject}</Text>
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
                                            <Text style={{ color: "#ffffff", fontWeight: "700" }}>Join</Text>
                                        </Pressable>
                                    ) : (
                                        <Pressable
                                            onPress={openGroupSessionScreen}
                                            style={{
                                                backgroundColor: "#2563eb",
                                                borderRadius: 10,
                                                paddingVertical: 11,
                                                alignItems: "center",
                                            }}
                                        >
                                            <Text style={{ color: "#ffffff", fontWeight: "700" }}>Continue</Text>
                                        </Pressable>
                                    )}
                                </>
                            ) : (
                                <>
                                    <Text style={{ color: "#9ca3af", marginBottom: 10 }}>Nobody is in a group study session right now.</Text>

                                    <Pressable
                                        onPress={openGroupSessionScreen}
                                        style={{
                                            backgroundColor: "#2563eb",
                                            borderRadius: 10,
                                            paddingVertical: 11,
                                            alignItems: "center",
                                        }}
                                    >
                                        <Text style={{ color: "#ffffff", fontWeight: "700" }}>Start Group Study</Text>
                                    </Pressable>
                                </>
                            )}
                        </View>

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
                                <Text style={{ color: "#ffffff", fontWeight: "700" }}>Delete Group</Text>
                            </Pressable>
                        ) : null}

                        <Text style={{ color: "#93c5fd", fontWeight: "700", marginBottom: 10 }}>
                            Members ({group.members.length})
                        </Text>

                        {group.members.map((member) => (
                            <View
                                key={member.id}
                                style={{ backgroundColor: "#111827", borderRadius: 12, padding: 12, marginBottom: 10 }}
                            >
                                <Text style={{ color: "#ffffff", fontWeight: "700" }}>
                                    {member.firstName} {member.lastName}
                                </Text>
                                <Text style={{ color: "#9ca3af", marginTop: 2 }}>@{member.username}</Text>
                                <Text style={{ color: "#9ca3af", marginBottom: 8 }}>{member.email}</Text>
                                <Text style={{ color: member.isAdmin ? "#93c5fd" : "#9ca3af", marginBottom: 8 }}>
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
                                        <Text style={{ color: "#ffffff", fontWeight: "700" }}>Remove Member</Text>
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
