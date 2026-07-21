import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/Text";
import { useTheme } from "@/lib/theme-context";
import { radius } from "@/lib/themes";
import { useLock } from "@/lib/lock-context";

export default function LockScreen() {
  const theme = useTheme();

  const { unlock } = useLock();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Pressable
        onPress={unlock}
        style={[styles.button, { backgroundColor: theme.primary }]}
      >
        <Text style={[styles.buttonText, { color: theme.primaryForeground }]}>
          Authenticate
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
