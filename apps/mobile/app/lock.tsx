import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/lib/theme-context";
import { radius } from "@/lib/themes";
import { useLock } from "@/lib/lock-context";
import { router } from "expo-router";

export default function LockScreen() {
  const theme = useTheme();

  const { unlock } = useLock();
  const authenticate = async () => {
    try {
      await unlock();
      router.replace("(app)");
    } catch (error) {
      console.error("Authentication failed:", error);
    }
  };
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Pressable
        onPress={authenticate}
        style={[styles.button, { backgroundColor: theme.primary }]}
      >
        <Text style={[styles.buttonText, { color: theme.primaryForeground }]}>
          Authenticate Now
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
