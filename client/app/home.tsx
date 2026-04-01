import { router } from "expo-router";
import { Pressable, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { pixelFontFamily } from "@/src/constants/typography";

export default function HomeScreen() {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220", padding: 20 }}>
            <Text style={{ color: "#ffffff", fontSize: 32, marginBottom: 8, fontFamily: pixelFontFamily }}>
                Pixel Library
            </Text>
            <Text style={{ color: "#9ca3af", fontSize: 18, marginBottom: 22, fontFamily: pixelFontFamily }}>
                Stay focused, track your sessions, and study with your group.
            </Text>

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
                <Text style={{ color: "#ffffff", fontSize: 20, fontFamily: pixelFontFamily }}>Groups</Text>
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
                <Text style={{ color: "#ffffff", fontSize: 20, fontFamily: pixelFontFamily }}>Start Solo Session</Text>
            </Pressable>

            <Pressable
                onPress={() => router.push("/history")}
                style={{
                    backgroundColor: "#1f2937",
                    borderRadius: 12,
                    paddingVertical: 13,
                    alignItems: "center",
                    marginBottom: 12,
                }}
            >
                <Text style={{ color: "#ffffff", fontSize: 20, fontFamily: pixelFontFamily }}>Session History</Text>
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
                <Text style={{ color: "#ffffff", fontSize: 20, fontFamily: pixelFontFamily }}>My Profile</Text>
            </Pressable>
        </SafeAreaView>
    );
}
