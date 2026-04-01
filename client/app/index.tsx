import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { clearStoredActiveSession } from "@/src/services/session-state";
import { clearToken, getToken } from "@/src/services/token";
import { getMe } from "@/src/services/user";

export default function IndexScreen() {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const token = await getToken();
                if (!token) {
                    setAuthenticated(false);
                    return;
                }

                await getMe();
                setAuthenticated(true);
            } catch {
                await clearToken();
                await clearStoredActiveSession();
                setAuthenticated(false);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#111827" }}>
                <ActivityIndicator color="#ffffff" />
            </View>
        );
    }

    return <Redirect href={authenticated ? "/home" : "/login"} />;
}
