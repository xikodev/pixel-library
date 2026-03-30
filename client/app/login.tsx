import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { login } from "@/src/services/auth";
import { setToken } from "@/src/services/token";

export default function LoginScreen() {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleLogin() {
        if (!identifier || !password) {
            Alert.alert("Missing fields", "Please enter email/username and password.");
            return;
        }

        try {
            setLoading(true);
            const result = await login({ identifier, password });
            await setToken(result.token);
            router.replace("/home");
        } catch (error: any) {
            const message = error?.response?.data?.message || "Login failed";
            Alert.alert("Error", message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220", padding: 20, justifyContent: "center" }}>
            <Text style={{ color: "#ffffff", fontSize: 32, fontWeight: "700", marginBottom: 24 }}>Pixel Library</Text>

            <TextInput
                placeholder="Email or username"
                placeholderTextColor="#9ca3af"
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                style={{
                    backgroundColor: "#111827",
                    color: "#ffffff",
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    marginBottom: 12,
                }}
            />

            <View
                style={{
                    backgroundColor: "#111827",
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    marginBottom: 18,
                    flexDirection: "row",
                    alignItems: "center",
                }}
            >
                <TextInput
                    placeholder="Password"
                    placeholderTextColor="#9ca3af"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    style={{
                        color: "#ffffff",
                        paddingVertical: 12,
                        flex: 1,
                    }}
                />
                <Pressable onPress={() => setShowPassword((prev) => !prev)} hitSlop={10}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9ca3af" />
                </Pressable>
            </View>

            <Pressable
                onPress={handleLogin}
                disabled={loading}
                style={{
                    backgroundColor: "#2563eb",
                    borderRadius: 12,
                    paddingVertical: 13,
                    alignItems: "center",
                    opacity: loading ? 0.7 : 1,
                }}
            >
                <Text style={{ color: "#ffffff", fontWeight: "700" }}>{loading ? "Signing in..." : "Login"}</Text>
            </Pressable>

            <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 16 }}>
                <Text style={{ color: "#9ca3af" }}>No account? </Text>
                <Pressable onPress={() => router.push("/signup")}>
                    <Text style={{ color: "#60a5fa", fontWeight: "600" }}>Sign up</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}
