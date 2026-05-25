import { Pressable } from "react-native";
import { makeStyles } from "@/lib/make-styles";
import { Text } from "@/components/ui/Text";

type ButtonProps = {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
};

export function Button({
  title,
  onPress,
  disabled,
  variant = "primary",
}: ButtonProps) {
  const styles = useStyles();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.label, styles[`${variant}Label`]]}>{title}</Text>
    </Pressable>
  );
}
const useStyles = makeStyles((theme) => ({
  base: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: theme.primary,
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.primary,
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
}));
