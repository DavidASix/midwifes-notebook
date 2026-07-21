import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/lib/theme-context";
import { radius } from "@/lib/themes";
import { useLock } from "@/lib/lock-context";
import { getAuthPreference } from "@/lib/locking";
import { router } from "expo-router";
import { useEffect, useState } from "react";

export default function LockScreen() {
  const theme = useTheme();
  const { unlock } = useLock();
  const [showAuthentication, setShowAuthentication] = useState(false);

  const authenticate = async () => {
    try {
      await unlock();
      router.replace("(app)");
    } catch (error) {
      console.error("Authentication failed:", error);
    }
  };

  useEffect(() => {
    // Ignore asynchronous work if navigation unmounts this route first.
    let cancelled = false;

    const bypassLockIfDisabled = async () => {
      try {
        const authPreference = await getAuthPreference();
        if (cancelled) return;

        if (authPreference === "unsecure") {
          // Opening the database is still required even without an auth prompt.
          await unlock();
          if (!cancelled) router.replace("/(app)");
          return;
        }

        // Secure (or missing) preferences require an explicit unlock attempt.
        setShowAuthentication(true);
      } catch (error) {
        console.error("Failed to open app:", error);
        if (!cancelled) setShowAuthentication(true);
      }
    };

    void bypassLockIfDisabled();

    return () => {
      cancelled = true;
    };
  }, [unlock]);

  if (!showAuthentication) return null;

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
