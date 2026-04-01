import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { InlineStatus } from "@/components/inline-status";
import { QuestCard } from "@/components/quest-card";
import { SessionHistoryItem, getSessionHistory } from "@/src/services/sessions";
import { pixelFontFamily } from "@/src/constants/typography";
import { formatDuration } from "@/src/utils/time";

function formatSessionDate(dateTime: string) {
    return new Date(dateTime).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

export default function HistoryScreen() {
    const [history, setHistory] = useState<SessionHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<string | null>(null);

    const loadHistory = useCallback(async () => {
        try {
            setLoading(true);
            setStatus(null);
            const data = await getSessionHistory();
            setHistory(data);
        } catch (error: any) {
            setStatus(error?.response?.data?.message || "Failed to load session history.");
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void loadHistory();
        }, [loadHistory])
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }}>
            <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 48 }}>
                <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
                    <Text style={{ color: "#93c5fd", fontSize: 17, fontFamily: pixelFontFamily }}>{"< Back"}</Text>
                </Pressable>

                <Text style={{ color: "#ffffff", fontSize: 32, marginBottom: 8, fontFamily: pixelFontFamily }}>
                    Session History
                </Text>
                <Text style={{ color: "#9ca3af", fontSize: 17, marginBottom: 18, fontFamily: pixelFontFamily }}>
                    Review your completed focus runs and see how your progress is stacking up.
                </Text>

                {status ? <InlineStatus tone="error" message={status} /> : null}

                {loading ? (
                    <QuestCard
                        eyebrow="Loading"
                        title="Unrolling your study log..."
                        description="Collecting your latest completed sessions from the archive."
                        accent="blue"
                    />
                ) : null}

                {!loading && history.length === 0 ? (
                    <QuestCard
                        eyebrow="No Records"
                        title="Your archive is still empty"
                        description="Finish a session and your study history will start filling up here."
                        accent="amber"
                    />
                ) : null}

                {!loading
                    ? history.map((session) => (
                          <View
                              key={session.id}
                              style={{
                                  backgroundColor: "#111827",
                                  borderRadius: 16,
                                  padding: 14,
                                  marginBottom: 12,
                                  borderWidth: 1,
                                  borderColor: session.studyGroupId ? "rgba(52, 211, 153, 0.3)" : "rgba(96, 165, 250, 0.25)",
                              }}
                          >
                              <Text style={{ color: "#ffffff", fontSize: 22, marginBottom: 4, fontFamily: pixelFontFamily }}>
                                  {session.subject}
                              </Text>
                              <Text style={{ color: "#93c5fd", fontSize: 15, marginBottom: 8, fontFamily: pixelFontFamily }}>
                                  {formatSessionDate(session.startDateTime)}
                              </Text>
                              <Text style={{ color: "#e5e7eb", fontSize: 16, marginBottom: 4, fontFamily: pixelFontFamily }}>
                                  Focus time: {formatDuration(session.totalTimeStudied)}
                              </Text>
                              <Text style={{ color: "#cbd5e1", fontSize: 15, marginBottom: 2, fontFamily: pixelFontFamily }}>
                                  Break time: {formatDuration(session.brakeTime)}
                              </Text>
                              <Text style={{ color: "#cbd5e1", fontSize: 15, marginBottom: 2, fontFamily: pixelFontFamily }}>
                                  Breaks taken: {session.brakeCount}
                              </Text>
                              <Text
                                  style={{
                                      color: session.studyGroupId ? "#34d399" : "#fbbf24",
                                      fontSize: 15,
                                      marginTop: 6,
                                      fontFamily: pixelFontFamily,
                                  }}
                              >
                                  {session.studyGroupId ? `Group session #${session.studyGroupId}` : "Solo session"}
                              </Text>
                          </View>
                      ))
                    : null}
            </ScrollView>
        </SafeAreaView>
    );
}
