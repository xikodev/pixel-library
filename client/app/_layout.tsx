import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { startBrake } from "@/src/services/sessions";
import { getStoredActiveSession, setStoredActiveSession } from "@/src/services/session-state";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);
    const [fontsLoaded] = useFonts({
        PixelifySans: require("@/assets/fonts/PixelifySans.ttf"),
    });

    const ensureBreakStartedForStoredSession = useCallback(async () => {
        const stored = await getStoredActiveSession();
        if (!stored || stored.onBreak) {
            return;
        }

        try {
            const result = await startBrake(stored.session.id);
            await setStoredActiveSession({
                session: {
                    ...stored.session,
                    brakeCount: result.brakeCount,
                },
                onBreak: true,
                brakeStartedAt: Date.now(),
            });
        } catch (error: any) {
            if (error?.response?.status === 409) {
                await setStoredActiveSession({
                    ...stored,
                    onBreak: true,
                    brakeStartedAt: stored.brakeStartedAt ?? Date.now(),
                });
                return;
            }
        }
    }, []);

    useEffect(() => {
        const subscription = AppState.addEventListener("change", (nextStatus) => {
            const previousStatus = appStateRef.current;
            appStateRef.current = nextStatus;

            if (previousStatus === "active" && nextStatus !== "active") {
                void ensureBreakStartedForStoredSession();
            }
        });

        return () => subscription.remove();
    }, [ensureBreakStartedForStoredSession]);

    useEffect(() => {
        if (fontsLoaded) {
            void SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    if (!fontsLoaded) {
        return null;
    }

    return (
        <>
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: {
                        backgroundColor: "#0b1220",
                        paddingTop: 8,
                        paddingBottom: 12,
                    },
                }}
            >
                <Stack.Screen name="index" />
                <Stack.Screen name="login" />
                <Stack.Screen name="signup" />
                <Stack.Screen name="home" />
                <Stack.Screen name="history" />
                <Stack.Screen name="groups" />
                <Stack.Screen name="group/[id]" />
                <Stack.Screen name="session" />
                <Stack.Screen name="profile" />
                <Stack.Screen name="profile-edit" />
            </Stack>
            <StatusBar style="light" />
        </>
    );
}
