import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, AppState, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { endBrake, endSession, getActiveSession, startBrake, startSession } from "@/src/services/sessions";
import { clearStoredActiveSession, getStoredActiveSession, setStoredActiveSession } from "@/src/services/session-state";
import { getGroupDetails } from "@/src/services/groups";
import { characters } from "@/src/constants/characters";
import { formatDuration } from "@/src/utils/time";
import { Image as ExpoImage } from "expo-image";

type SessionState = {
    id: number;
    subject: string;
    startDateTime: string;
    brakeCount: number;
    brakeTime: number;
    studyGroupId?: number | null;
};

export default function SessionScreen() {
    const params = useLocalSearchParams<{ groupId?: string; subject?: string }>();
    const requestedGroupId = useMemo(() => {
        if (!params.groupId) {
            return null;
        }

        const parsed = Number(params.groupId);
        return Number.isInteger(parsed) ? parsed : null;
    }, [params.groupId]);

    const [subject, setSubject] = useState("");
    const [activeSession, setActiveSession] = useState<SessionState | null>(null);
    const [onBreak, setOnBreak] = useState(false);
    const [loading, setLoading] = useState(false);
    const [brakeStartedAt, setBrakeStartedAt] = useState<number | null>(null);
    const [nowMs, setNowMs] = useState(Date.now());
    const [restoring, setRestoring] = useState(true);
    const [tableCharacterIds, setTableCharacterIds] = useState<number[]>([]);
    const forcingBreakRef = useRef(false);
    const hydratedRef = useRef(false);
    const characterImageById = useMemo(() => {
        return new Map(characters.map((item) => [item.id, item.image]));
    }, []);

    const forceBreakIfNeeded = useCallback(async () => {
        if (!activeSession || onBreak || forcingBreakRef.current) {
            return;
        }

        forcingBreakRef.current = true;
        try {
            const result = await startBrake(activeSession.id);
            const startedAt = Date.now();
            setOnBreak(true);
            setBrakeStartedAt(startedAt);
            setActiveSession((previous) => (previous ? { ...previous, brakeCount: result.brakeCount } : previous));
        } catch (error: any) {
            if (error?.response?.status === 409) {
                setOnBreak(true);
                setBrakeStartedAt((previous) => previous ?? Date.now());
            }
        } finally {
            forcingBreakRef.current = false;
        }
    }, [activeSession, onBreak]);

    useEffect(() => {
        (async () => {
            try {
                const restored = await getStoredActiveSession();
                if (restored) {
                    setActiveSession(restored.session);
                    setOnBreak(restored.onBreak);
                    setBrakeStartedAt(restored.brakeStartedAt);
                    setSubject(restored.session.subject);
                }

                const serverActive = await getActiveSession();
                if (serverActive) {
                    const restoredSession = {
                        id: serverActive.id,
                        subject: serverActive.subject,
                        startDateTime: serverActive.startDateTime,
                        brakeCount: serverActive.brakeCount,
                        brakeTime: serverActive.brakeTime,
                        studyGroupId: serverActive.studyGroupId ?? null,
                    };

                    setActiveSession(restoredSession);
                    setOnBreak(Boolean(serverActive.currentBrakeStartDateTime));
                    setBrakeStartedAt(
                        serverActive.currentBrakeStartDateTime ? new Date(serverActive.currentBrakeStartDateTime).getTime() : null
                    );
                    setSubject(serverActive.subject);
                } else {
                    setActiveSession(null);
                    setOnBreak(false);
                    setBrakeStartedAt(null);
                    await clearStoredActiveSession();
                }
            } finally {
                hydratedRef.current = true;
                setRestoring(false);
            }
        })();
    }, []);

    const handleStartSession = useCallback(
        async (subjectOverride?: string) => {
            const sessionSubject = (subjectOverride ?? subject).trim();
            if (!sessionSubject) {
                Alert.alert("Missing subject", "Please enter a subject.");
                return;
            }

            try {
                setLoading(true);
                const session = await startSession(sessionSubject, requestedGroupId ?? undefined);
                setActiveSession({
                    id: session.id,
                    subject: session.subject,
                    startDateTime: session.startDateTime,
                    brakeCount: session.brakeCount,
                    brakeTime: session.brakeTime,
                    studyGroupId: session.studyGroupId ?? requestedGroupId ?? null,
                });
                setOnBreak(false);
                setBrakeStartedAt(null);
                setSubject(session.subject);
            } catch (error: any) {
                if (error?.response?.status === 409) {
                    try {
                        const existing = await getActiveSession();
                        if (existing) {
                            setActiveSession({
                                id: existing.id,
                                subject: existing.subject,
                                startDateTime: existing.startDateTime,
                                brakeCount: existing.brakeCount,
                                brakeTime: existing.brakeTime,
                                studyGroupId: existing.studyGroupId ?? null,
                            });
                            setOnBreak(Boolean(existing.currentBrakeStartDateTime));
                            setBrakeStartedAt(
                                existing.currentBrakeStartDateTime ? new Date(existing.currentBrakeStartDateTime).getTime() : null
                            );
                            setSubject(existing.subject);
                            return;
                        }
                    } catch {
                        // Fall through to the existing error alert below.
                    }
                }

                Alert.alert("Error", error?.response?.data?.message || "Failed to start session");
            } finally {
                setLoading(false);
            }
        },
        [requestedGroupId, subject]
    );

    useEffect(() => {
        if (activeSession || restoring || subject.trim().length > 0) {
            return;
        }

        if (typeof params.subject === "string" && params.subject.trim()) {
            setSubject(params.subject.trim());
        }
    }, [activeSession, params.subject, restoring, subject]);

    useEffect(() => {
        if (!hydratedRef.current || restoring) {
            return;
        }

        (async () => {
            if (!activeSession) {
                await clearStoredActiveSession();
                return;
            }

            await setStoredActiveSession({
                session: activeSession,
                onBreak,
                brakeStartedAt,
            });
        })();
    }, [activeSession, onBreak, brakeStartedAt, restoring]);

    useEffect(() => {
        if (!activeSession) {
            return;
        }

        const intervalId = setInterval(() => {
            setNowMs(Date.now());
        }, 1000);

        return () => clearInterval(intervalId);
    }, [activeSession]);

    useEffect(() => {
        const subscription = AppState.addEventListener("change", (nextStatus) => {
            if (nextStatus !== "active") {
                void forceBreakIfNeeded();
            }
        });

        return () => subscription.remove();
    }, [forceBreakIfNeeded]);

    useEffect(() => {
        return () => {
            void forceBreakIfNeeded();
        };
    }, [forceBreakIfNeeded]);

    const loadTableCharacters = useCallback(async (groupId: number) => {
        try {
            const group = await getGroupDetails(groupId);
            const ids = group.groupStudy.participants
                .map((participant) => {
                    const profileCharacter = participant.person.character;
                    if (Number.isInteger(profileCharacter) && profileCharacter > 0) {
                        return profileCharacter;
                    }

                    // Fallback for stale backend payloads missing character.
                    return ((participant.person.id - 1) % 11) + 1;
                })
                .slice(0, 6);
            setTableCharacterIds(ids);
        } catch {
            setTableCharacterIds([]);
        }
    }, []);

    useEffect(() => {
        const groupId = activeSession?.studyGroupId;
        if (!groupId) {
            setTableCharacterIds([]);
            return;
        }

        void loadTableCharacters(groupId);
        const intervalId = setInterval(() => {
            void loadTableCharacters(groupId);
        }, 8000);

        return () => clearInterval(intervalId);
    }, [activeSession?.studyGroupId, loadTableCharacters]);

    async function handleStartBrake() {
        if (!activeSession) {
            return;
        }

        try {
            setLoading(true);
            const result = await startBrake(activeSession.id);
            setOnBreak(true);
            setBrakeStartedAt(Date.now());
            setActiveSession((previous) => (previous ? { ...previous, brakeCount: result.brakeCount } : previous));
        } catch (error: any) {
            if (error?.response?.status === 409) {
                try {
                    const existing = await getActiveSession();
                    if (existing && existing.id === activeSession.id) {
                        const startedAt = existing.currentBrakeStartDateTime
                            ? new Date(existing.currentBrakeStartDateTime).getTime()
                            : Date.now();
                        setOnBreak(true);
                        setBrakeStartedAt(startedAt);
                        setActiveSession((previous) =>
                            previous
                                ? {
                                      ...previous,
                                      brakeCount: existing.brakeCount,
                                      brakeTime: existing.brakeTime,
                                  }
                                : previous
                        );
                        return;
                    }
                } catch {
                    // Fall through to the existing error alert below.
                }
            }
            Alert.alert("Error", error?.response?.data?.message || "Failed to start break");
        } finally {
            setLoading(false);
        }
    }

    async function handleEndBrake() {
        if (!activeSession) {
            return;
        }

        try {
            setLoading(true);
            const result = await endBrake(activeSession.id);
            setOnBreak(false);
            setBrakeStartedAt(null);
            setActiveSession((previous) => (previous ? { ...previous, brakeTime: result.brakeTime } : previous));
        } catch (error: any) {
            Alert.alert("Error", error?.response?.data?.message || "Failed to end break");
        } finally {
            setLoading(false);
        }
    }

    async function handleEndSession() {
        if (!activeSession) {
            return;
        }

        try {
            setLoading(true);
            const result = await endSession(activeSession.id);
            Alert.alert(
                "Session ended",
                `Studied: ${formatDuration(result.totalsAdded.totalTimeStudied)}\nBreaks: ${
                    result.totalsAdded.totalBrakes
                }\nBreak time: ${formatDuration(result.totalsAdded.totalBrakeTime)}`
            );
            setActiveSession(null);
            setOnBreak(false);
            setBrakeStartedAt(null);
            setSubject("");
            await clearStoredActiveSession();
        } catch (error: any) {
            Alert.alert("Error", error?.response?.data?.message || "Failed to end session");
        } finally {
            setLoading(false);
        }
    }

    const liveBrakeSeconds =
        onBreak && brakeStartedAt ? Math.max(0, Math.floor((nowMs - brakeStartedAt) / 1000)) : 0;

    const displayedBrakeTime = (activeSession?.brakeTime ?? 0) + liveBrakeSeconds;

    const elapsedSessionSeconds = activeSession
        ? Math.max(0, Math.floor((nowMs - new Date(activeSession.startDateTime).getTime()) / 1000))
        : 0;

    const studiedSeconds = Math.max(0, elapsedSessionSeconds - displayedBrakeTime);
    const hasValidSubject = subject.trim().length > 0;

    if (restoring) {
        return <SafeAreaView style={styles.preSessionScreen} />;
    }

    if (!activeSession) {
        return (
            <SafeAreaView style={styles.preSessionScreen}>
                <Pressable onPress={() => router.back()} style={styles.preSessionBackButton}>
                    <Text style={styles.backText}>{"< Back"}</Text>
                </Pressable>

                <Text style={styles.preSessionTitle}>Start Session</Text>
                {requestedGroupId ? <Text style={styles.groupHint}>Starting in group study mode</Text> : null}

                <TextInput
                    placeholder="Subject"
                    placeholderTextColor="#9ca3af"
                    value={subject}
                    onChangeText={setSubject}
                    onSubmitEditing={() => {
                        if (!loading && hasValidSubject) {
                            void handleStartSession();
                        }
                    }}
                    returnKeyType="done"
                    editable={!loading}
                    style={styles.preSessionInput}
                />

                <Pressable
                    onPress={() => {
                        void handleStartSession();
                    }}
                    disabled={loading || !hasValidSubject}
                    style={[styles.preSessionStartButton, !hasValidSubject ? styles.preSessionStartButtonDisabled : undefined]}
                >
                    <Text style={styles.buttonText}>Start Session</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.background}>
                <ExpoImage
                    source={require("@/assets/library.png")}
                    style={StyleSheet.absoluteFillObject}
                    contentFit="cover"
                    allowDownscaling={false}
                />
                {tableCharacterIds.length > 0 ? (
                    <View pointerEvents="none" style={styles.tableCharactersRow}>
                        <View style={styles.tableCharactersTrack}>
                            {tableCharacterIds.map((characterId, index) => {
                                const sprite = characterImageById.get(characterId);
                                if (!sprite) {
                                    return null;
                                }

                                return (
                                    <View key={`${characterId}-${index}`} style={styles.tableSeatSlot}>
                                        <View style={styles.tableSeat}>
                                            <ExpoImage source={sprite} style={styles.tableCharacterImage} contentFit="contain" />
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                ) : null}

                <View style={styles.bottomOverlay}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <Text style={styles.backText}>{"< Back"}</Text>
                    </Pressable>

                    <Text style={styles.title}>Session</Text>
                    <View style={styles.sessionCard}>
                        <Text style={styles.sessionSubject}>{activeSession.subject}</Text>
                        <Text style={styles.sessionMeta}>Break count: {activeSession.brakeCount}</Text>
                        {activeSession.studyGroupId ? (
                            <Text style={styles.sessionMeta}>Group study: group #{activeSession.studyGroupId}</Text>
                        ) : null}
                        <Text style={styles.sessionMeta}>Break time: {formatDuration(displayedBrakeTime)}</Text>
                        <Text style={styles.sessionMeta}>Time studied: {formatDuration(studiedSeconds)}</Text>

                        {!onBreak ? (
                            <Pressable onPress={handleStartBrake} disabled={loading} style={styles.breakStartButton}>
                                <Text style={styles.buttonText}>Start Break</Text>
                            </Pressable>
                        ) : (
                            <Pressable onPress={handleEndBrake} disabled={loading} style={styles.breakEndButton}>
                                <Text style={styles.buttonText}>End Break</Text>
                            </Pressable>
                        )}

                        <Pressable onPress={handleEndSession} disabled={loading} style={styles.endSessionButton}>
                            <Text style={styles.buttonText}>End Session</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    preSessionScreen: {
        flex: 1,
        backgroundColor: "#0b1220",
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    preSessionBackButton: {
        marginBottom: 18,
    },
    preSessionTitle: {
        color: "#ffffff",
        fontSize: 28,
        fontWeight: "700",
        marginBottom: 16,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    groupHint: {
        color: "#34d399",
        marginBottom: 10,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },
    preSessionInput: {
        backgroundColor: "#111827",
        color: "#ffffff",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 12,
    },
    preSessionStartButton: {
        backgroundColor: "#2563eb",
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: "center",
    },
    preSessionStartButtonDisabled: {
        opacity: 0.5,
    },
    screen: {
        flex: 1,
        backgroundColor: "#0b1220",
    },
    background: {
        flex: 1,
        justifyContent: "flex-end",
    },
    tableCharactersRow: {
        position: "absolute",
        left: "8%",
        right: "8%",
        top: "19.5%",
        height: 96,
        zIndex: 8,
    },
    tableCharactersTrack: {
        flex: 1,
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "center",
    },
    tableSeatSlot: {
        flex: 1,
        alignItems: "center",
    },
    tableSeat: {
        width: 76,
        height: 84,
        overflow: "hidden",
        alignItems: "center",
    },
    tableCharacterImage: {
        width: 82,
        height: 128,
        marginTop: 0,
    },
    bottomOverlay: {
        minHeight: "30%",
        backgroundColor: "rgba(11, 18, 32, 0.78)",
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 16,
    },
    backButton: {
        marginBottom: 8,
    },
    backText: {
        color: "#93c5fd",
        fontWeight: "600",
        letterSpacing: 0.4,
    },
    title: {
        color: "#ffffff",
        fontSize: 26,
        fontWeight: "700",
        marginBottom: 10,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    sessionCard: {
        backgroundColor: "rgba(17, 24, 39, 0.92)",
        borderRadius: 12,
        padding: 12,
    },
    sessionSubject: {
        color: "#ffffff",
        fontWeight: "700",
        marginBottom: 6,
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },
    sessionMeta: {
        color: "#d1d5db",
        marginBottom: 6,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    breakStartButton: {
        backgroundColor: "#b45309",
        borderRadius: 10,
        paddingVertical: 11,
        alignItems: "center",
        marginTop: 4,
        marginBottom: 8,
    },
    breakEndButton: {
        backgroundColor: "#059669",
        borderRadius: 10,
        paddingVertical: 11,
        alignItems: "center",
        marginTop: 4,
        marginBottom: 8,
    },
    endSessionButton: {
        backgroundColor: "#991b1b",
        borderRadius: 10,
        paddingVertical: 11,
        alignItems: "center",
    },
    buttonText: {
        color: "#ffffff",
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },
});
