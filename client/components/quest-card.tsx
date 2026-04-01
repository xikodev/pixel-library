import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { pixelFontFamily } from "@/src/constants/typography";

type QuestCardProps = {
    eyebrow?: string;
    title: string;
    description: string;
    accent?: "blue" | "green" | "amber";
    children?: ReactNode;
};

const accents = {
    blue: {
        border: "#60a5fa",
        glow: "rgba(96, 165, 250, 0.12)",
        eyebrow: "#93c5fd",
    },
    green: {
        border: "#34d399",
        glow: "rgba(52, 211, 153, 0.12)",
        eyebrow: "#6ee7b7",
    },
    amber: {
        border: "#f59e0b",
        glow: "rgba(245, 158, 11, 0.12)",
        eyebrow: "#fcd34d",
    },
};

export function QuestCard({ eyebrow, title, description, accent = "blue", children }: QuestCardProps) {
    const colors = accents[accent];

    return (
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.glow }]}>
            {eyebrow ? <Text style={[styles.eyebrow, { color: colors.eyebrow }]}>{eyebrow}</Text> : null}
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
            {children ? <View style={styles.actions}>{children}</View> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderWidth: 1,
        borderRadius: 18,
        padding: 16,
    },
    eyebrow: {
        fontFamily: pixelFontFamily,
        fontSize: 14,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 8,
    },
    title: {
        color: "#ffffff",
        fontFamily: pixelFontFamily,
        fontSize: 24,
        marginBottom: 8,
    },
    description: {
        color: "#cbd5e1",
        fontFamily: pixelFontFamily,
        fontSize: 16,
        lineHeight: 22,
    },
    actions: {
        marginTop: 14,
    },
});
