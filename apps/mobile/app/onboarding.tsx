import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/lib/theme-context";
import { radius } from "@/lib/themes";

export default function OnboardingScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Pressable
        onPress={() => router.replace("/(tabs)/clients")}
        style={[styles.button, { backgroundColor: theme.primary }]}
      >
        <Text style={[styles.buttonText, { color: theme.primaryForeground }]}>
          Get Started
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: radius.xl,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "600",
  },
});
