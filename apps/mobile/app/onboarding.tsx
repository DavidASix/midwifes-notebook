import { Pressable, StyleSheet, View } from "react-native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, router } from "expo-router";
import * as SecureStore from "expo-secure-store";

import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/lib/theme-context";
import { fontSize, fontFamilies, radius } from "@/lib/themes";
import {
  type AuthPreference,
  setAuthPreference,
  getOrCreateDbKey,
} from "@/lib/locking";

const ONBOARDING_COMPLETE_KEY = "onboardingComplete";

export default function OnboardingScreen() {
  const [onboardingComplete, setOnboardingComplete] = useState<
    boolean | undefined
  >(undefined);
  const [selectedPref, setSelectedPref] = useState<AuthPreference | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [loading, setLoading] = useState(false);

  const theme = useTheme();

  useEffect(() => {
    const init = async () => {
      try {
        const [value, storeAvailable] = await Promise.all([
          AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY),
          SecureStore.isAvailableAsync(),
        ]);
        setOnboardingComplete(value === "complete");
        setBiometricAvailable(
          storeAvailable && SecureStore.canUseBiometricAuthentication(),
        );
      } catch (e) {
        console.error("Failed to read onboarding status", e);
        setOnboardingComplete(false);
      }
    };
    init();
  }, []);

  const completeOnboarding = async () => {
    if (!selectedPref) return;
    setLoading(true);
    try {
      await setAuthPreference(selectedPref);
      await getOrCreateDbKey();
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "complete");
      router.replace("lock");
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    } finally {
      setLoading(false);
    }
  };

  if (onboardingComplete === undefined) return null;
  if (onboardingComplete) return <Redirect href="/lock" />;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.foreground }]}>
          Secure your data
        </Text>
        <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
          Choose how you want to protect access to this app.
        </Text>
      </View>

      <View style={styles.options}>
        <Pressable
          onPress={() => biometricAvailable && setSelectedPref("secure")}
          style={[
            styles.option,
            {
              backgroundColor: theme.card,
              borderColor:
                selectedPref === "secure" ? theme.primary : theme.border,
            },
            !biometricAvailable && styles.optionDisabled,
          ]}
        >
          <Text
            style={[
              styles.optionTitle,
              {
                color: biometricAvailable
                  ? theme.foreground
                  : theme.mutedForeground,
              },
            ]}
          >
            Biometric / PIN
          </Text>
          <Text style={[styles.optionDesc, { color: theme.mutedForeground }]}>
            {biometricAvailable
              ? "Require Face ID, fingerprint, or PIN to open the app."
              : "Not available on this device."}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setSelectedPref("unsecure")}
          style={[
            styles.option,
            {
              backgroundColor: theme.card,
              borderColor:
                selectedPref === "unsecure" ? theme.primary : theme.border,
            },
          ]}
        >
          <Text style={[styles.optionTitle, { color: theme.foreground }]}>
            No lock
          </Text>
          <Text style={[styles.optionDesc, { color: theme.mutedForeground }]}>
            Open the app without authentication.
          </Text>
        </Pressable>
      </View>

      <Button
        title={loading ? "Setting up…" : "Get Started"}
        onPress={completeOnboarding}
        disabled={!selectedPref || loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 32,
  },
  header: {
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontFamily: fontFamilies.heading.bold,
    fontSize: fontSize["3xl"],
    textAlign: "center",
  },
  subtitle: {
    fontFamily: fontFamilies.base.regular,
    fontSize: fontSize.md,
    textAlign: "center",
    lineHeight: 22,
  },
  options: {
    width: "100%",
    gap: 12,
  },
  option: {
    borderWidth: 2,
    borderRadius: radius["2xl"],
    padding: 20,
    gap: 4,
  },
  optionDisabled: {
    opacity: 0.45,
  },
  optionTitle: {
    fontFamily: fontFamilies.base.semiBold,
    fontSize: fontSize.md,
  },
  optionDesc: {
    fontFamily: fontFamilies.base.regular,
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
});
