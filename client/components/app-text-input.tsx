import { StyleSheet, Text, TextInput, TextInputProps, TextStyle, View, ViewStyle } from "react-native";

type AppTextInputProps = TextInputProps;

const INPUT_STYLE_KEYS = new Set([
    "color",
    "fontFamily",
    "fontSize",
    "fontStyle",
    "fontVariant",
    "fontWeight",
    "letterSpacing",
    "lineHeight",
    "padding",
    "paddingBottom",
    "paddingEnd",
    "paddingHorizontal",
    "paddingLeft",
    "paddingRight",
    "paddingStart",
    "paddingTop",
    "paddingVertical",
    "textAlign",
    "textAlignVertical",
]);

function splitStyles(style: AppTextInputProps["style"]) {
    const flat = (StyleSheet.flatten(style) || {}) as Record<string, unknown>;
    const containerStyle: ViewStyle = {};
    const inputStyle: TextStyle = {};

    for (const [key, value] of Object.entries(flat)) {
        if (INPUT_STYLE_KEYS.has(key)) {
            inputStyle[key as keyof TextStyle] = value as never;
        } else {
            containerStyle[key as keyof ViewStyle] = value as never;
        }
    }

    return { containerStyle, inputStyle };
}

function hasDisplayValue(value: TextInputProps["value"]) {
    if (typeof value === "string") {
        return value.length > 0;
    }

    if (typeof value === "number") {
        return true;
    }

    return false;
}

export function AppTextInput({ style, placeholder, placeholderTextColor = "#9ca3af", value, ...props }: AppTextInputProps) {
    const { containerStyle, inputStyle } = splitStyles(style);
    const showPlaceholder = Boolean(placeholder) && !hasDisplayValue(value);

    return (
        <View style={[styles.container, containerStyle]}>
            {showPlaceholder ? (
                <View pointerEvents="none" style={styles.placeholderLayer}>
                    <Text numberOfLines={1} style={[styles.placeholderText, inputStyle, { color: placeholderTextColor }]}>
                        {placeholder}
                    </Text>
                </View>
            ) : null}

            <TextInput
                {...props}
                value={value}
                placeholder=""
                style={[styles.input, inputStyle]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: "center",
    },
    input: {
        backgroundColor: "transparent",
        padding: 0,
        margin: 0,
    },
    placeholderLayer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
    },
    placeholderText: {
        includeFontPadding: false,
    },
});
