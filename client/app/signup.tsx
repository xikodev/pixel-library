import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { AppTextInput } from "@/components/app-text-input";
import { InlineStatus } from "@/components/inline-status";
import { signup } from "@/src/services/auth";
import { pixelFontFamily } from "@/src/constants/typography";
import { setToken } from "@/src/services/token";
import { characters } from "@/src/constants/characters";

export default function SignupScreen() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [character, setCharacter] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    async function handleSignup() {
        if (!username || !email || !firstName || !lastName || !password) {
            setStatusMessage("Please fill in all fields before creating your account.");
            return;
        }

        if (character === null) {
            setStatusMessage("Choose a character or select no character before continuing.");
            return;
        }

        try {
            setLoading(true);
            setStatusMessage(null);
            const result = await signup({ username, email, firstName, lastName, password, character });
            await setToken(result.token);
            router.replace("/home");
        } catch (error: any) {
            const message = error?.response?.data?.message || "Sign up failed";
            setStatusMessage(message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }}>
            <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 48 }}>
                <Text style={{ color: "#ffffff", fontSize: 34, marginBottom: 10, fontFamily: pixelFontFamily }}>
                    Create account
                </Text>
                <Text style={{ color: "#9ca3af", fontSize: 18, marginBottom: 20, fontFamily: pixelFontFamily }}>
                    Build your study profile and start tracking focus time.
                </Text>

                {[
                    { placeholder: "Username", value: username, setter: setUsername, secure: false, cap: "none" as const },
                    { placeholder: "Email", value: email, setter: setEmail, secure: false, cap: "none" as const },
                    { placeholder: "First name", value: firstName, setter: setFirstName, secure: false, cap: "words" as const },
                    { placeholder: "Last name", value: lastName, setter: setLastName, secure: false, cap: "words" as const },
                ].map((field) => (
                    <AppTextInput
                        key={field.placeholder}
                        placeholder={field.placeholder}
                        placeholderTextColor="#9ca3af"
                        value={field.value}
                        onChangeText={field.setter}
                        onFocus={() => setStatusMessage(null)}
                        secureTextEntry={field.secure}
                        autoCapitalize={field.cap}
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
                ))}

                <View
                    style={{
                        backgroundColor: "#111827",
                        borderRadius: 12,
                        paddingHorizontal: 14,
                        marginBottom: 12,
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
                        autoCapitalize="none"
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

                <Text style={{ color: "#ffffff", fontSize: 18, marginTop: 6, marginBottom: 8, fontFamily: pixelFontFamily }}>
                    Choose your character
                </Text>
                <Text style={{ color: "#9ca3af", fontSize: 16, marginBottom: 10, fontFamily: pixelFontFamily }}>
                    Pick a sprite, or leave it empty for now.
                </Text>

                <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 8 }}>
                    <Pressable
                        onPress={() => setCharacter(0)}
                        style={{
                            width: "31%",
                            height: 120,
                            backgroundColor: "#111827",
                            borderRadius: 10,
                            marginBottom: 10,
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: 2,
                            borderColor: character === 0 ? "#60a5fa" : "#1f2937",
                        }}
                    >
                        <Ionicons name="close-circle-outline" size={30} color="#cbd5e1" />
                    </Pressable>

                    {characters.map((item) => (
                        <Pressable
                            key={item.id}
                            onPress={() => setCharacter(item.id)}
                            style={{
                                width: "31%",
                                height: 120,
                                backgroundColor: "#111827",
                                borderRadius: 10,
                                marginBottom: 10,
                                alignItems: "center",
                                justifyContent: "center",
                                borderWidth: 2,
                                borderColor: character === item.id ? "#60a5fa" : "#1f2937",
                            }}
                        >
                            <ExpoImage
                                source={item.image}
                                style={{ width: 96, height: 96 }}
                                contentFit="contain"
                                allowDownscaling={false}
                            />
                        </Pressable>
                    ))}
                </View>

                <Text style={{ color: "#93c5fd", fontSize: 16, marginBottom: 6, fontFamily: pixelFontFamily }}>
                    {character === null ? "Selected: none yet" : character === 0 ? "Selected: no character" : "Selected: sprite"}
                </Text>

                {statusMessage ? <InlineStatus tone="error" message={statusMessage} /> : null}

                <Pressable
                    onPress={handleSignup}
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
                        {loading ? "Creating..." : "Create Account"}
                    </Text>
                </Pressable>

                <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 16 }}>
                    <Text style={{ color: "#9ca3af", fontSize: 17, fontFamily: pixelFontFamily }}>Already have an account? </Text>
                    <Pressable onPress={() => router.replace("/login")}>
                        <Text style={{ color: "#60a5fa", fontSize: 17, fontFamily: pixelFontFamily }}>Sign in</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
