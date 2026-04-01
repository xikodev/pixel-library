import { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useFocusEffect } from "@react-navigation/native";
import { characters } from "@/src/constants/characters";
import { QuestCard } from "@/components/quest-card";
import { pixelFontFamily } from "@/src/constants/typography";
import { clearToken } from "@/src/services/token";
import { deleteMe, getMe, MeDto } from "@/src/services/user";
import { formatDuration } from "@/src/utils/time";

export default function ProfileScreen() {
    const [me, setMe] = useState<MeDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    const loadMe = useCallback(async function loadMe() {
        try {
            setLoading(true);
            const data = await getMe();
            setMe(data);
        } catch (error: any) {
            Alert.alert("Error", error?.response?.data?.message || "Failed to load profile");
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void loadMe();
        }, [loadMe])
    );

    async function handleDeleteProfile() {
        try {
            setDeleting(true);
            await deleteMe();
            await clearToken();
            router.replace("/login");
        } catch (error: any) {
            Alert.alert("Error", error?.response?.data?.message || "Failed to delete profile");
        } finally {
            setDeleting(false);
        }
    }

    function confirmDeleteProfile() {
        Alert.alert("Delete profile", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                    void handleDeleteProfile();
                },
            },
        ]);
    }

    async function handleLogout() {
        await clearToken();
        router.replace("/login");
    }

    const selectedCharacter = me ? characters.find((item) => item.id === me.character) : undefined;

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.content}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backText}>{"< Back"}</Text>
                </Pressable>

                <Text style={styles.title}>Profile</Text>

                {loading ? (
                    <QuestCard
                        eyebrow="Loading"
                        title="Opening your adventurer profile"
                        description="Gathering your stats, character, and account details."
                        accent="blue"
                    />
                ) : me ? (
                    <>
                        <View style={styles.card}>
                            <View style={styles.characterPreview}>
                                {selectedCharacter ? (
                                    <ExpoImage source={selectedCharacter.image} style={styles.characterPreviewImage} contentFit="contain" />
                                ) : (
                                    <Ionicons name="person-circle-outline" size={48} color="#9ca3af" />
                                )}
                            </View>

                            <Text style={styles.nameText}>
                                {me.firstName} {me.lastName}
                            </Text>
                            <Text style={styles.subtleText}>@{me.username}</Text>
                            <Text style={[styles.subtleText, styles.emailText]}>{me.email}</Text>

                            <Text style={styles.statsTitle}>Stats</Text>
                            <Text style={styles.statText}>Total studied: {formatDuration(me.totalTimeStudied)}</Text>
                            <Text style={styles.statText}>Total breaks: {me.totalBrakes}</Text>
                            <Text style={styles.statText}>Total break time: {formatDuration(me.totalBrakeTime)}</Text>
                        </View>

                        <Pressable onPress={() => router.push("/profile-edit")} style={styles.editButton}>
                            <Text style={styles.editButtonText}>Edit</Text>
                        </Pressable>

                        <Pressable onPress={handleLogout} style={styles.logoutButton}>
                            <Text style={styles.logoutButtonText}>Log Out</Text>
                        </Pressable>

                        <Pressable
                            onPress={confirmDeleteProfile}
                            disabled={deleting}
                            style={[styles.deleteButton, deleting ? styles.buttonDisabled : undefined]}
                        >
                            <Text style={styles.deleteButtonText}>{deleting ? "Deleting..." : "Delete profile"}</Text>
                        </Pressable>
                    </>
                ) : (
                    <QuestCard
                        eyebrow="No Profile"
                        title="Your profile is missing"
                        description="We could not load your profile data. Try reopening the app or signing in again."
                        accent="amber"
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#0b1220",
    },
    content: {
        flex: 1,
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
    card: {
        backgroundColor: "#111827",
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
    },
    characterPreview: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: "#0b1220",
        borderWidth: 1,
        borderColor: "#1f2937",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
        alignSelf: "center",
    },
    characterPreviewImage: {
        width: 74,
        height: 74,
    },
    nameText: {
        color: "#ffffff",
        fontSize: 22,
        marginBottom: 6,
        textAlign: "center",
        fontFamily: pixelFontFamily,
    },
    subtleText: {
        color: "#9ca3af",
        fontSize: 17,
        fontFamily: pixelFontFamily,
    },
    emailText: {
        marginBottom: 10,
    },
    statsTitle: {
        color: "#93c5fd",
        fontSize: 18,
        marginBottom: 8,
        marginTop: 4,
        fontFamily: pixelFontFamily,
    },
    statText: {
        color: "#ffffff",
        fontSize: 17,
        marginBottom: 4,
        fontFamily: pixelFontFamily,
    },
    editButton: {
        backgroundColor: "#2563eb",
        borderRadius: 10,
        alignItems: "center",
        paddingVertical: 12,
        marginBottom: 10,
    },
    editButtonText: {
        color: "#ffffff",
        fontSize: 18,
        fontFamily: pixelFontFamily,
    },
    deleteButton: {
        backgroundColor: "#7f1d1d",
        borderRadius: 10,
        alignItems: "center",
        paddingVertical: 12,
    },
    logoutButton: {
        backgroundColor: "#1f2937",
        borderRadius: 10,
        alignItems: "center",
        paddingVertical: 12,
        marginBottom: 10,
    },
    logoutButtonText: {
        color: "#ffffff",
        fontSize: 18,
        fontFamily: pixelFontFamily,
    },
    deleteButtonText: {
        color: "#ffffff",
        fontSize: 18,
        fontFamily: pixelFontFamily,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
});
