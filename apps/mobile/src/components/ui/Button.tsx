import {
  Pressable,
  type AccessibilityRole,
  type AccessibilityState,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import type { ReactNode } from "react";
import { makeStyles } from "@/lib/make-styles";
import { Text } from "@/components/ui/Text";

type ButtonProps = {
  title?: string;
  children?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  size?: "default" | "compact" | "bare";
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  testID?: string;
};

export function Button({
  title,
  children,
  onPress,
  disabled,
  variant = "primary",
  size = "default",
  style,
  accessibilityLabel,
  accessibilityRole = "button",
  accessibilityState,
  testID,
}: ButtonProps) {
  const styles = useStyles();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ ...accessibilityState, disabled }}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        styles[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {children ?? (
        <Text style={[styles.label, styles[`${variant}Label`]]}>{title}</Text>
      )}
    </Pressable>
  );
}
const useStyles = makeStyles((theme) => ({
  base: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  default: {
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  compact: {
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 13,
  },
  bare: {
    minHeight: 44,
  },
  primary: {
    backgroundColor: theme.primary,
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.primary,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
  primaryLabel: {
    color: theme.primaryForeground,
  },
  secondaryLabel: {
    color: theme.primary,
  },
  ghostLabel: {
    color: theme.primary,
  },
}));
