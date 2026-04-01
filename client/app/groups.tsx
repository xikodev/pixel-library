import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { AppTextInput } from "@/components/app-text-input";
import { InlineStatus } from "@/components/inline-status";
import { QuestCard } from "@/components/quest-card";
import { createGroup, getMyGroups, GroupDto, joinByCode } from "@/src/services/groups";
import { pixelFontFamily } from "@/src/constants/typography";

export default function GroupsScreen() {
    const [groups, setGroups] = useState<GroupDto[]>([]);
    const [newGroupName, setNewGroupName] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ tone: "error" | "success"; message: string } | null>(null);

    async function loadGroups() {
        try {
            const data = await getMyGroups();
            setGroups(data);
        } catch (error: any) {
            setStatus({ tone: "error", message: error?.response?.data?.message || "Failed to load groups." });
        }
    }

    useEffect(() => {
        void loadGroups();
    }, []);

    useFocusEffect(
        useCallback(() => {
            void loadGroups();
        }, [])
    );

    async function handleCreate() {
        if (!newGroupName.trim()) {
            setStatus({ tone: "error", message: "Enter a group name before creating a group." });
            return;
        }

        try {
            setLoading(true);
            setStatus(null);
            await createGroup(newGroupName.trim());
            setNewGroupName("");
            await loadGroups();
            setStatus({ tone: "success", message: "Group created successfully." });
        } catch (error: any) {
            setStatus({ tone: "error", message: error?.response?.data?.message || "Failed to create group." });
        } finally {
            setLoading(false);
        }
    }

    async function handleJoin() {
        const code = joinCode.trim().toUpperCase();
        if (code.length !== 8) {
            setStatus({ tone: "error", message: "Invite code must be 8 letters." });
            return;
        }

        try {
            setLoading(true);
            setStatus(null);
            await joinByCode(code);
            setJoinCode("");
            await loadGroups();
            setStatus({ tone: "success", message: "You joined the group." });
        } catch (error: any) {
            setStatus({ tone: "error", message: error?.response?.data?.message || "Failed to join group." });
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }}>
            <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 48 }}>
                <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
                    <Text style={{ color: "#93c5fd", fontSize: 17, fontFamily: pixelFontFamily }}>{"< Back"}</Text>
                </Pressable>

                <Text style={{ color: "#ffffff", fontSize: 32, marginBottom: 8, fontFamily: pixelFontFamily }}>
                    Groups
                </Text>
                <Text style={{ color: "#9ca3af", fontSize: 17, marginBottom: 18, fontFamily: pixelFontFamily }}>
                    Create a private study group or join one with an invite code.
                </Text>

                <View style={{ backgroundColor: "#111827", borderRadius: 12, padding: 12, marginBottom: 14 }}>
                    <Text style={{ color: "#9ca3af", fontSize: 17, marginBottom: 8, fontFamily: pixelFontFamily }}>Create a new group</Text>
                    <AppTextInput
                        placeholder="Group name"
                        placeholderTextColor="#9ca3af"
                        value={newGroupName}
                        onChangeText={setNewGroupName}
                        onFocus={() => setStatus(null)}
                        style={{
                            backgroundColor: "#0f172a",
                            color: "#ffffff",
                            fontFamily: pixelFontFamily,
                            fontSize: 18,
                            borderRadius: 10,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            marginBottom: 10,
                        }}
                    />
                    <Pressable
                        onPress={handleCreate}
                        disabled={loading}
                        style={{ backgroundColor: "#2563eb", borderRadius: 10, paddingVertical: 11, alignItems: "center" }}
                    >
                        <Text style={{ color: "#ffffff", fontSize: 18, fontFamily: pixelFontFamily }}>Create Group</Text>
                    </Pressable>
                </View>

                <View style={{ backgroundColor: "#111827", borderRadius: 12, padding: 12, marginBottom: 16 }}>
                    <Text style={{ color: "#9ca3af", fontSize: 17, marginBottom: 8, fontFamily: pixelFontFamily }}>Join with an invite code</Text>
                    <AppTextInput
                        placeholder="ABCDEFGH"
                        placeholderTextColor="#9ca3af"
                        autoCapitalize="characters"
                        value={joinCode}
                        onChangeText={setJoinCode}
                        onFocus={() => setStatus(null)}
                        style={{
                            backgroundColor: "#0f172a",
                            color: "#ffffff",
                            fontFamily: pixelFontFamily,
                            fontSize: 18,
                            borderRadius: 10,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            marginBottom: 10,
                        }}
                    />
                    <Pressable
                        onPress={handleJoin}
                        disabled={loading}
                        style={{ backgroundColor: "#059669", borderRadius: 10, paddingVertical: 11, alignItems: "center" }}
                    >
                        <Text style={{ color: "#ffffff", fontSize: 18, fontFamily: pixelFontFamily }}>Join Group</Text>
                    </Pressable>
                </View>

                {status ? <InlineStatus tone={status.tone} message={status.message} /> : null}

                {loading && groups.length === 0 ? (
                    <View style={{ marginTop: 16, marginBottom: 16 }}>
                        <QuestCard
                            eyebrow="Loading"
                            title="Summoning your study guilds..."
                            description="Pulling your latest groups and active rooms from the library."
                            accent="blue"
                        />
                    </View>
                ) : null}

                {groups.map((group) => (
                    <Pressable
                        key={group.id}
                        onPress={() => router.push({ pathname: "/group/[id]", params: { id: String(group.id) } })}
                        style={{ backgroundColor: "#111827", borderRadius: 12, padding: 12, marginBottom: 10 }}
                    >
                        <Text style={{ color: "#ffffff", fontSize: 20, fontFamily: pixelFontFamily }}>
                            {group.name}
                        </Text>
                        <Text style={{ color: "#9ca3af", fontSize: 16, marginTop: 4, fontFamily: pixelFontFamily }}>Members: {group.memberCount}</Text>
                        <Text style={{ color: "#9ca3af", fontSize: 16, fontFamily: pixelFontFamily }}>Invite: {group.inviteCode}</Text>
                        {group.hasActiveGroupSession ? (
                            <Text style={{ color: "#34d399", fontSize: 16, marginTop: 2, fontFamily: pixelFontFamily }}>
                                Active group session
                            </Text>
                        ) : null}
                        <Text style={{ color: group.isAdmin ? "#93c5fd" : "#9ca3af", fontSize: 16, marginTop: 2, fontFamily: pixelFontFamily }}>
                            {group.isAdmin ? "You are admin" : "Member"}
                        </Text>
                    </Pressable>
                ))}

                {!loading && groups.length === 0 ? (
                    <QuestCard
                        eyebrow="No Guilds"
                        title="Your party list is empty"
                        description="Create a fresh study group or join one with an invite code to start a shared session."
                        accent="amber"
                    />
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
}
