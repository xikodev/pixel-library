import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { AppTextInput } from "@/components/app-text-input";
import { characters } from "@/src/constants/characters";
import { pixelFontFamily } from "@/src/constants/typography";
import { getMe, MeDto, updateMe } from "@/src/services/user";

export default function ProfileEditScreen() {
    const [me, setMe] = useState<MeDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState("");
    const [character, setCharacter] = useState<number | null>(null);

    function applyUserForm(data: MeDto) {
        setUsername(data.username ?? "");
        setEmail(data.email ?? "");
        setFirstName(data.firstName ?? "");
        setLastName(data.lastName ?? "");
        setPassword("");
        setCharacter(data.character ?? 0);
    }

    const loadMe = useCallback(async function loadMe() {
        try {
            setLoading(true);
            const data = await getMe();
            setMe(data);
            applyUserForm(data);
        } catch (error: any) {
            Alert.alert("Error", error?.response?.data?.message || "Failed to load profile");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadMe();
    }, [loadMe]);

    const hasUnsavedChanges = useMemo(() => {
        if (!me || character === null) {
            return false;
        }

        return (
            username.trim() !== me.username ||
            email.trim().toLowerCase() !== me.email.toLowerCase() ||
            firstName.trim() !== me.firstName ||
            lastName.trim() !== me.lastName ||
            character !== me.character ||
            password.trim().length > 0
        );
    }, [character, email, firstName, lastName, me, password, username]);

    async function handleSaveProfile() {
        const nextUsername = username.trim();
        const nextEmail = email.trim().toLowerCase();
        const nextFirstName = firstName.trim();
        const nextLastName = lastName.trim();
        const nextPassword = password.trim();

        if (!nextUsername || !nextEmail || !nextFirstName || !nextLastName || character === null) {
            Alert.alert("Missing fields", "Username, email, first name, last name, and character are required.");
            return;
        }

        if (!nextEmail.includes("@")) {
            Alert.alert("Invalid email", "Please enter a valid email address.");
            return;
        }

        if (nextPassword && nextPassword.length < 6) {
            Alert.alert("Invalid password", "New password must be at least 6 characters.");
            return;
        }

        try {
            setSaving(true);
            const payload: Parameters<typeof updateMe>[0] = {
                username: nextUsername,
                email: nextEmail,
                firstName: nextFirstName,
                lastName: nextLastName,
                character,
            };

            if (nextPassword) {
                payload.password = nextPassword;
            }

            await updateMe({
                ...payload,
            });

            Alert.alert("Saved", "Your profile has been updated.");
            router.back();
        } catch (error: any) {
            const status = error?.response?.status;
            const message = error?.response?.data?.message || "Failed to update profile";
            const usernameTaken = status === 400 && /username/i.test(message);
            const emailTaken = status === 400 && /email/i.test(message);
            const usernameOrEmailTaken = status === 409;

            if (usernameOrEmailTaken) {
                Alert.alert("Unavailable", "That username or email is already in use. Change one of them and try again.");
                return;
            }

            if (usernameTaken) {
                Alert.alert("Username unavailable", "That username is already in use. Choose another one.");
                return;
            }

            if (emailTaken) {
                Alert.alert("Email unavailable", "That email is already in use. Choose another one.");
                return;
            }

            Alert.alert("Error", message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.content}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backText}>{"< Back"}</Text>
                </Pressable>

                <Text style={styles.title}>Edit Profile</Text>

                {loading ? (
                    <Text style={styles.subtleText}>Loading...</Text>
                ) : (
                    <View style={styles.card}>
                        <AppTextInput
                            placeholder="First name"
                            placeholderTextColor="#9ca3af"
                            value={firstName}
                            onChangeText={setFirstName}
                            autoCapitalize="words"
                            editable={!saving}
                            style={styles.input}
                        />

                        <AppTextInput
                            placeholder="Last name"
                            placeholderTextColor="#9ca3af"
                            value={lastName}
                            onChangeText={setLastName}
                            autoCapitalize="words"
                            editable={!saving}
                            style={styles.input}
                        />

                        <AppTextInput
                            placeholder="Username"
                            placeholderTextColor="#9ca3af"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            editable={!saving}
                            style={styles.input}
                        />

                        <AppTextInput
                            placeholder="Email"
                            placeholderTextColor="#9ca3af"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!saving}
                            style={styles.input}
                        />

                        <AppTextInput
                            placeholder="New password (optional)"
                            placeholderTextColor="#9ca3af"
                            value={password}
                            onChangeText={setPassword}
                            autoCapitalize="none"
                            secureTextEntry
                            editable={!saving}
                            style={styles.input}
                        />

                        <Text style={styles.sectionTitle}>Character</Text>
                        <Text style={styles.subtleText}>
                            {character === null ? "Selected: none yet" : character === 0 ? "Selected: no character" : `Selected: #${character}`}
                        </Text>

                        <View style={styles.characterGrid}>
                            <Pressable
                                onPress={() => setCharacter(0)}
                                disabled={saving}
                                style={[styles.characterTile, character === 0 ? styles.characterTileSelected : undefined]}
                            >
                                <Ionicons name="close-circle-outline" size={28} color="#cbd5e1" />
                            </Pressable>

                            {characters.map((item) => (
                                <Pressable
                                    key={item.id}
                                    onPress={() => setCharacter(item.id)}
                                    disabled={saving}
                                    style={[styles.characterTile, character === item.id ? styles.characterTileSelected : undefined]}
                                >
                                    <ExpoImage source={item.image} style={styles.characterImage} contentFit="contain" allowDownscaling={false} />
                                </Pressable>
                            ))}
                        </View>

                        <Pressable
                            onPress={handleSaveProfile}
                            disabled={saving || !hasUnsavedChanges}
                            style={[styles.saveButton, saving || !hasUnsavedChanges ? styles.buttonDisabled : undefined]}
                        >
                            <Text style={styles.saveButtonText}>{saving ? "Saving..." : "Save Changes"}</Text>
                        </Pressable>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#0b1220",
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 48,
        paddingBottom: 24,
    },
    backButton: {
        marginBottom: 16,
    },
    backText: {
        color: "#93c5fd",
        fontSize: 17,
        fontFamily: pixelFontFamily,
    },
    title: {
        color: "#ffffff",
        fontSize: 32,
        marginBottom: 16,
        fontFamily: pixelFontFamily,
    },
    subtleText: {
        color: "#9ca3af",
        fontSize: 17,
        fontFamily: pixelFontFamily,
    },
    card: {
        backgroundColor: "#111827",
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
    },
    sectionTitle: {
        color: "#ffffff",
        fontSize: 18,
        marginBottom: 8,
        fontFamily: pixelFontFamily,
    },
    input: {
        backgroundColor: "#0b1220",
        color: "#ffffff",
        fontFamily: pixelFontFamily,
        fontSize: 18,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#1f2937",
        paddingHorizontal: 12,
        paddingVertical: 11,
        marginBottom: 10,
    },
    characterGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginTop: 10,
    },
    characterTile: {
        width: "31%",
        height: 96,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "#1f2937",
        backgroundColor: "#0b1220",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },
    characterTileSelected: {
        borderColor: "#60a5fa",
    },
    characterImage: {
        width: 78,
        height: 78,
    },
    saveButton: {
        backgroundColor: "#2563eb",
        borderRadius: 10,
        alignItems: "center",
        paddingVertical: 12,
        marginTop: 6,
    },
    saveButtonText: {
        color: "#ffffff",
        fontSize: 18,
        fontFamily: pixelFontFamily,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
});
