import { Pressable, Text } from "react-native";

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
  const variants = {
    primary: "bg-primary",
    secondary: "bg-secondary",
  };
  const disabledClass = disabled ? "opacity-40" : "";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`rounded-full px-6 py-3 items-center justify-center ${variants[variant]} ${disabledClass}`}
    >
      <Text className="text-xl">{title}</Text>
    </Pressable>
  );
}
