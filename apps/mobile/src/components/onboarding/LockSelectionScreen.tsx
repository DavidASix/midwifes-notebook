import { Pressable, View } from "react-native";
import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { LockType } from "@/lib/async-storage";
import { getOrCreateDbKey, setAuthPreference } from "@/lib/locking";
import { makeStyles } from "@/lib/make-styles";
import { useTheme } from "@/lib/theme-context";
import { fontFamilies, fontSize, radius } from "@/lib/themes";

export function LockSelectionScreen({
  onContinue,
}: {
  onContinue: () => Promise<void>;
}) {
  const styles = useStyles();
  const theme = useTheme();
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [selectedPreference, setSelectedPreference] = useState<LockType | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkBiometricAvailability = async () => {
      const storeAvailable = await SecureStore.isAvailableAsync();
      setBiometricAvailable(
        storeAvailable && SecureStore.canUseBiometricAuthentication(),
      );
    };

    checkBiometricAvailability().catch((error) => {
      console.error("Failed to check biometric availability:", error);
      setBiometricAvailable(false);
    });
  }, []);

  const completeLockSelection = async () => {
    if (!selectedPreference) return;

    setLoading(true);
    try {
      await setAuthPreference(selectedPreference);
      await getOrCreateDbKey();
      await onContinue();
    } catch (error) {
      console.error("Failed to complete lock selection:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Secure your data</Text>
          <Text style={styles.subtitle}>
            Choose how you want to protect access to this app.
          </Text>
        </View>

        <View style={styles.options} accessibilityRole="radiogroup">
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{
              checked: selectedPreference === LockType.Secure,
              disabled: !biometricAvailable,
            }}
            disabled={!biometricAvailable || loading}
            onPress={() => setSelectedPreference(LockType.Secure)}
            style={[
              styles.option,
              selectedPreference === LockType.Secure && {
                borderColor: theme.primary,
              },
              !biometricAvailable && styles.optionDisabled,
            ]}
          >
            <Text
              style={[
                styles.optionTitle,
                !biometricAvailable && styles.optionTextDisabled,
              ]}
            >
              Biometric / PIN
            </Text>
            <Text style={styles.optionDescription}>
              {biometricAvailable
                ? "Require Face ID, fingerprint, or PIN to open the app."
                : "Not available on this device."}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="radio"
            accessibilityState={{
              checked: selectedPreference === LockType.Unsecure,
            }}
            disabled={loading}
            onPress={() => setSelectedPreference(LockType.Unsecure)}
            style={[
              styles.option,
              selectedPreference === LockType.Unsecure && {
                borderColor: theme.primary,
              },
            ]}
          >
            <Text style={styles.optionTitle}>No lock</Text>
            <Text style={styles.optionDescription}>
              Open the app without authentication.
            </Text>
          </Pressable>
        </View>
      </View>

      <Button
        title={loading ? "Setting up…" : "Get Started"}
        onPress={completeLockSelection}
        disabled={!selectedPreference || loading}
      />
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    flex: 1,
    justifyContent: "center" as const,
    paddingHorizontal: 24,
    paddingBottom: 72,
    gap: 32,
  },
  content: {
    gap: 32,
  },
  header: {
    alignItems: "center" as const,
    gap: 8,
  },
  title: {
    color: theme.foreground,
    fontFamily: fontFamilies.heading.bold,
    fontSize: fontSize["3xl"],
    textAlign: "center" as const,
  },
  subtitle: {
    color: theme.mutedForeground,
    fontFamily: fontFamilies.base.regular,
    fontSize: fontSize.md,
    lineHeight: 22,
    textAlign: "center" as const,
  },
  options: {
    gap: 12,
  },
  option: {
    gap: 4,
    padding: 20,
    borderWidth: 2,
    borderColor: theme.border,
    borderRadius: radius["2xl"],
    backgroundColor: theme.card,
  },
  optionDisabled: {
    opacity: 0.45,
  },
  optionTitle: {
    color: theme.foreground,
    fontFamily: fontFamilies.base.semiBold,
    fontSize: fontSize.md,
  },
  optionTextDisabled: {
    color: theme.mutedForeground,
  },
  optionDescription: {
    color: theme.mutedForeground,
    fontFamily: fontFamilies.base.regular,
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
}));
