import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { createGroup, getMyGroups, GroupDto, joinByCode } from "@/src/services/groups";

export default function GroupsScreen() {
    const [groups, setGroups] = useState<GroupDto[]>([]);
    const [newGroupName, setNewGroupName] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [loading, setLoading] = useState(false);

    async function loadGroups() {
        try {
            const data = await getMyGroups();
            setGroups(data);
        } catch (error: any) {
            Alert.alert("Error", error?.response?.data?.message || "Failed to load groups");
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
            Alert.alert("Missing name", "Enter a group name.");
            return;
        }

        try {
            setLoading(true);
            await createGroup(newGroupName.trim());
            setNewGroupName("");
            await loadGroups();
        } catch (error: any) {
            Alert.alert("Error", error?.response?.data?.message || "Failed to create group");
        } finally {
            setLoading(false);
        }
    }

    async function handleJoin() {
        const code = joinCode.trim().toUpperCase();
        if (code.length !== 8) {
            Alert.alert("Invalid code", "Invite code must be 8 letters.");
            return;
        }

        try {
            setLoading(true);
            await joinByCode(code);
            setJoinCode("");
            await loadGroups();
        } catch (error: any) {
            Alert.alert("Error", error?.response?.data?.message || "Failed to join group");
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }}>
            <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 48 }}>
                <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
                    <Text style={{ color: "#93c5fd" }}>{"< Back"}</Text>
                </Pressable>

                <Text style={{ color: "#ffffff", fontSize: 28, fontWeight: "700", marginBottom: 18 }}>Groups</Text>

                <View style={{ backgroundColor: "#111827", borderRadius: 12, padding: 12, marginBottom: 14 }}>
                    <Text style={{ color: "#9ca3af", marginBottom: 8 }}>Create group</Text>
                    <TextInput
                        placeholder="Group name"
                        placeholderTextColor="#9ca3af"
                        value={newGroupName}
                        onChangeText={setNewGroupName}
                        style={{
                            backgroundColor: "#0f172a",
                            color: "#ffffff",
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
                        <Text style={{ color: "#ffffff", fontWeight: "700" }}>Create</Text>
                    </Pressable>
                </View>

                <View style={{ backgroundColor: "#111827", borderRadius: 12, padding: 12, marginBottom: 16 }}>
                    <Text style={{ color: "#9ca3af", marginBottom: 8 }}>Join by invite code</Text>
                    <TextInput
                        placeholder="ABCDEFGH"
                        placeholderTextColor="#9ca3af"
                        autoCapitalize="characters"
                        value={joinCode}
                        onChangeText={setJoinCode}
                        style={{
                            backgroundColor: "#0f172a",
                            color: "#ffffff",
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
                        <Text style={{ color: "#ffffff", fontWeight: "700" }}>Join</Text>
                    </Pressable>
                </View>

                {groups.map((group) => (
                    <Pressable
                        key={group.id}
                        onPress={() => router.push({ pathname: "/group/[id]", params: { id: String(group.id) } })}
                        style={{ backgroundColor: "#111827", borderRadius: 12, padding: 12, marginBottom: 10 }}
                    >
                        <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "700" }}>{group.name}</Text>
                        <Text style={{ color: "#9ca3af", marginTop: 4 }}>Members: {group.memberCount}</Text>
                        <Text style={{ color: "#9ca3af" }}>Invite: {group.inviteCode}</Text>
                        {group.hasActiveGroupSession ? (
                            <Text style={{ color: "#34d399", marginTop: 2, fontWeight: "700" }}>Active group session</Text>
                        ) : null}
                        <Text style={{ color: group.isAdmin ? "#93c5fd" : "#9ca3af", marginTop: 2 }}>
                            {group.isAdmin ? "You are admin" : "Member"}
                        </Text>
                    </Pressable>
                ))}

                {groups.length === 0 ? <Text style={{ color: "#9ca3af" }}>No groups yet.</Text> : null}
            </ScrollView>
        </SafeAreaView>
    );
}
