import { StyleSheet, Text, View } from "react-native";
import { pixelFontFamily } from "@/src/constants/typography";

type InlineStatusProps = {
    tone: "error" | "success" | "info";
    message: string;
};

const toneStyles = {
    error: {
        backgroundColor: "rgba(127, 29, 29, 0.22)",
        borderColor: "rgba(248, 113, 113, 0.55)",
        color: "#fecaca",
    },
    success: {
        backgroundColor: "rgba(5, 150, 105, 0.18)",
        borderColor: "rgba(52, 211, 153, 0.5)",
        color: "#d1fae5",
    },
    info: {
        backgroundColor: "rgba(37, 99, 235, 0.16)",
        borderColor: "rgba(96, 165, 250, 0.45)",
        color: "#dbeafe",
    },
};

export function InlineStatus({ tone, message }: InlineStatusProps) {
    const colors = toneStyles[tone];

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundColor, borderColor: colors.borderColor }]}>
            <Text style={[styles.text, { color: colors.color }]}>{message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    text: {
        fontFamily: pixelFontFamily,
        fontSize: 16,
        lineHeight: 20,
    },
});
