import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { getToken } from "@/src/services/token";

export default function IndexScreen() {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        (async () => {
            const token = await getToken();
            setAuthenticated(Boolean(token));
            setLoading(false);
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
