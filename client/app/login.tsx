import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppTextInput } from "@/components/app-text-input";
import { InlineStatus } from "@/components/inline-status";
import { login } from "@/src/services/auth";
import { pixelFontFamily } from "@/src/constants/typography";
import { setToken } from "@/src/services/token";

export default function LoginScreen() {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    async function handleLogin() {
        if (!identifier || !password) {
            setStatusMessage("Please enter your email or username and password.");
            return;
        }

        try {
            setLoading(true);
            setStatusMessage(null);
            const result = await login({ identifier, password });
            await setToken(result.token);
            router.replace("/home");
        } catch (error: any) {
            const message = error?.response?.data?.message || "Login failed";
            setStatusMessage(message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220", padding: 20, justifyContent: "center" }}>
            <Text style={{ color: "#ffffff", fontSize: 36, marginBottom: 12, fontFamily: pixelFontFamily }}>
                Pixel Library
            </Text>
            <Text style={{ color: "#9ca3af", fontSize: 18, marginBottom: 24, fontFamily: pixelFontFamily }}>
                Sign in and pick up where you left off.
            </Text>

            <AppTextInput
                placeholder="Email or username"
                placeholderTextColor="#9ca3af"
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                onFocus={() => setStatusMessage(null)}
                style={{
                    backgroundColor: "#111827",
                    color: "#ffffff",
                    fontFamily: pixelFontFamily,
                    fontSize: 18,
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
                <AppTextInput
                    placeholder="Password"
                    placeholderTextColor="#9ca3af"
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setStatusMessage(null)}
                    secureTextEntry={!showPassword}
                    style={{
                        color: "#ffffff",
                        fontFamily: pixelFontFamily,
                        fontSize: 18,
                        paddingVertical: 12,
                        flex: 1,
                    }}
                />
                <Pressable onPress={() => setShowPassword((prev) => !prev)} hitSlop={10}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9ca3af" />
                </Pressable>
            </View>

            {statusMessage ? <InlineStatus tone="error" message={statusMessage} /> : null}

            <Pressable
                onPress={handleLogin}
                disabled={loading}
                style={{
                    backgroundColor: "#2563eb",
                    borderRadius: 12,
                    paddingVertical: 13,
                    alignItems: "center",
                    marginTop: 12,
                    opacity: loading ? 0.7 : 1,
                }}
            >
                <Text style={{ color: "#ffffff", fontFamily: pixelFontFamily }}>
                    {loading ? "Signing in..." : "Sign In"}
                </Text>
            </Pressable>

            <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 16 }}>
                <Text style={{ color: "#9ca3af", fontSize: 17, fontFamily: pixelFontFamily }}>No account? </Text>
                <Pressable onPress={() => router.push("/signup")}>
                    <Text style={{ color: "#60a5fa", fontSize: 17, fontFamily: pixelFontFamily }}>Create one</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}
