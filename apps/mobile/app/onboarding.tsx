import { Pressable, StyleSheet, View } from "react-native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, router } from "expo-router";

import { Text } from "@/components/ui/Text";
import { useTheme } from "@/lib/theme-context";
import { radius } from "@/lib/themes";

const ONBOARDING_COMPLETE_KEY = "onboardingComplete";

export default function OnboardingScreen() {
  const [onboardingComplete, setOnboardingComplete] = useState<
    boolean | undefined
  >(undefined);

  const theme = useTheme();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
        setOnboardingComplete(value === "complete");
      } catch (e) {
        console.error("Failed to read onboarding status", e);
        setOnboardingComplete(false);
      }
    };
    checkOnboardingStatus();
  }, []);

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "complete");
    router.replace("lock");
  };

  if (onboardingComplete === undefined) {
    return null;
  }

  if (onboardingComplete) {
    return <Redirect href="/lock" />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Pressable
        onPress={completeOnboarding}
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
