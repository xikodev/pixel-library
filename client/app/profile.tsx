import { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useFocusEffect } from "@react-navigation/native";
import { characters } from "@/src/constants/characters";
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

    const selectedCharacter = me ? characters.find((item) => item.id === me.character) : undefined;

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.content}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backText}>{"< Back"}</Text>
                </Pressable>

                <Text style={styles.title}>Profile</Text>

                {loading ? (
                    <Text style={styles.subtleText}>Loading...</Text>
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

                        <Pressable
                            onPress={confirmDeleteProfile}
                            disabled={deleting}
                            style={[styles.deleteButton, deleting ? styles.buttonDisabled : undefined]}
                        >
                            <Text style={styles.deleteButtonText}>{deleting ? "Deleting..." : "Delete profile"}</Text>
                        </Pressable>
                    </>
                ) : (
                    <Text style={styles.subtleText}>No profile data.</Text>
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
        fontWeight: "600",
    },
    title: {
        color: "#ffffff",
        fontSize: 28,
        fontWeight: "700",
        marginBottom: 16,
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
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 6,
        textAlign: "center",
    },
    subtleText: {
        color: "#9ca3af",
    },
    emailText: {
        marginBottom: 10,
    },
    statsTitle: {
        color: "#93c5fd",
        fontWeight: "700",
        marginBottom: 8,
        marginTop: 4,
    },
    statText: {
        color: "#ffffff",
        marginBottom: 4,
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
        fontWeight: "700",
    },
    deleteButton: {
        backgroundColor: "#7f1d1d",
        borderRadius: 10,
        alignItems: "center",
        paddingVertical: 12,
    },
    deleteButtonText: {
        color: "#ffffff",
        fontWeight: "700",
    },
    buttonDisabled: {
        opacity: 0.6,
    },
});
