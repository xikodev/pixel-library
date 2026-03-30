import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, API_BASE_URL } from "@/src/services/api";
import { clearToken } from "@/src/services/token";

export default function HomeScreen() {
    const [health, setHealth] = useState("Checking...");

    useEffect(() => {
        (async () => {
            try {
                const response = await api.get("/health");
                setHealth(response.data?.ok ? "API is online" : "API responded");
            } catch {
                setHealth("API check failed");
            }
        })();
    }, []);

    async function handleLogout() {
        await clearToken();
        router.replace("/login");
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220", padding: 20 }}>
            <Text style={{ color: "#ffffff", fontSize: 28, fontWeight: "700", marginBottom: 10 }}>Welcome</Text>
            <Text style={{ color: "#9ca3af", marginBottom: 22 }}>Base URL: {API_BASE_URL}</Text>

            <View style={{ backgroundColor: "#111827", borderRadius: 12, padding: 14, marginBottom: 16 }}>
                <Text style={{ color: "#93c5fd", fontWeight: "600" }}>Backend status</Text>
                <Text style={{ color: "#ffffff", marginTop: 6 }}>{health}</Text>
            </View>

            <Pressable
                onPress={() => router.push("/groups")}
                style={{
                    backgroundColor: "#1f2937",
                    borderRadius: 12,
                    paddingVertical: 13,
                    alignItems: "center",
                    marginBottom: 12,
                }}
            >
                <Text style={{ color: "#ffffff", fontWeight: "600" }}>Groups</Text>
            </Pressable>

            <Pressable
                onPress={() => router.push("/session")}
                style={{
                    backgroundColor: "#1f2937",
                    borderRadius: 12,
                    paddingVertical: 13,
                    alignItems: "center",
                    marginBottom: 12,
                }}
            >
                <Text style={{ color: "#ffffff", fontWeight: "600" }}>Session</Text>
            </Pressable>

            <Pressable
                onPress={() => router.push("/profile")}
                style={{
                    backgroundColor: "#1f2937",
                    borderRadius: 12,
                    paddingVertical: 13,
                    alignItems: "center",
                    marginBottom: 12,
                }}
            >
                <Text style={{ color: "#ffffff", fontWeight: "600" }}>Profile</Text>
            </Pressable>

            <Pressable
                onPress={handleLogout}
                style={{
                    backgroundColor: "#7f1d1d",
                    borderRadius: 12,
                    paddingVertical: 13,
                    alignItems: "center",
                }}
            >
                <Text style={{ color: "#ffffff", fontWeight: "700" }}>Logout</Text>
            </Pressable>
        </SafeAreaView>
    );
}
