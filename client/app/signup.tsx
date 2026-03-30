import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { signup } from "@/src/services/auth";
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

    async function handleSignup() {
        if (!username || !email || !firstName || !lastName || !password) {
            Alert.alert("Missing fields", "Please fill all fields.");
            return;
        }

        if (character === null) {
            Alert.alert("Choose character", "Pick a character (1-11) or select No character (0).");
            return;
        }

        try {
            setLoading(true);
            const result = await signup({ username, email, firstName, lastName, password, character });
            await setToken(result.token);
            router.replace("/home");
        } catch (error: any) {
            const message = error?.response?.data?.message || "Sign up failed";
            Alert.alert("Error", message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }}>
            <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 48 }}>
                <Text style={{ color: "#ffffff", fontSize: 30, fontWeight: "700", marginBottom: 20 }}>Create account</Text>

                {[
                    { placeholder: "Username", value: username, setter: setUsername, secure: false, cap: "none" as const },
                    { placeholder: "Email", value: email, setter: setEmail, secure: false, cap: "none" as const },
                    { placeholder: "First name", value: firstName, setter: setFirstName, secure: false, cap: "words" as const },
                    { placeholder: "Last name", value: lastName, setter: setLastName, secure: false, cap: "words" as const },
                ].map((field) => (
                    <TextInput
                        key={field.placeholder}
                        placeholder={field.placeholder}
                        placeholderTextColor="#9ca3af"
                        value={field.value}
                        onChangeText={field.setter}
                        secureTextEntry={field.secure}
                        autoCapitalize={field.cap}
                        style={{
                            backgroundColor: "#111827",
                            color: "#ffffff",
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
                    <TextInput
                        placeholder="Password"
                        placeholderTextColor="#9ca3af"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
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

                <Text style={{ color: "#ffffff", fontWeight: "700", marginTop: 6, marginBottom: 8 }}>
                    Choose character (required)
                </Text>
                <Text style={{ color: "#9ca3af", marginBottom: 10 }}>Select one, or keep none (0).</Text>

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

                <Text style={{ color: "#93c5fd", marginBottom: 6 }}>
                    {character === null ? "Selected: none yet" : character === 0 ? "Selected: no character" : "Selected: sprite"}
                </Text>

                <Pressable
                    onPress={handleSignup}
                    disabled={loading}
                    style={{
                        backgroundColor: "#2563eb",
                        borderRadius: 12,
                        paddingVertical: 13,
                        alignItems: "center",
                        marginTop: 8,
                        opacity: loading ? 0.7 : 1,
                    }}
                >
                    <Text style={{ color: "#ffffff", fontWeight: "700" }}>{loading ? "Creating..." : "Sign up"}</Text>
                </Pressable>

                <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 16 }}>
                    <Text style={{ color: "#9ca3af" }}>Already have an account? </Text>
                    <Pressable onPress={() => router.replace("/login")}>
                        <Text style={{ color: "#60a5fa", fontWeight: "600" }}>Login</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
