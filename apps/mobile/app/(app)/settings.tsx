import { StyleSheet, Switch, View } from "react-native";
import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { useLock } from "@/lib/lock-context";
import { LockType } from "@/lib/async-storage";
import { makeStyles } from "@/lib/make-styles";
import { useToggleTheme } from "@/lib/theme-context";
import { fontSize, fontFamilies } from "@/lib/themes";
import {
  getAuthPreference,
  setAuthPreference,
  getOrCreateDbKey,
} from "@/lib/locking";

export default function SettingsScreen() {
  const { lock } = useLock();
  const toggleTheme = useToggleTheme();
  const styles = useStyles();
  const [authPref, setAuthPref] = useState<LockType | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const init = async () => {
      const [pref, storeAvailable] = await Promise.all([
        getAuthPreference(),
        SecureStore.isAvailableAsync(),
      ]);
      setAuthPref(pref);
      setBiometricAvailable(
        storeAvailable && SecureStore.canUseBiometricAuthentication(),
      );
    };
    init();
  }, []);

  const handleToggleLock = async (enabled: boolean) => {
    const newPref = enabled ? LockType.Secure : LockType.Unsecure;
    const prevPref = authPref;
    setAuthPref(newPref);
    setUpdating(true);
    try {
      await setAuthPreference(newPref);
      await getOrCreateDbKey();
    } catch (error) {
      console.error("Failed to update auth preference:", error);
      if (prevPref) await setAuthPreference(prevPref);
      setAuthPref(prevPref);
    } finally {
      setUpdating(false);
    }
  };

  const lockEnabled = authPref === LockType.Secure;
  const toggleDisabled = updating || (!biometricAvailable && !lockEnabled);

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Security</Text>
        <View style={styles.row}>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>App Lock</Text>
            <Text style={styles.rowDesc}>
              Require biometric or PIN to open the app
            </Text>
          </View>
          <Switch
            value={lockEnabled}
            onValueChange={handleToggleLock}
            disabled={toggleDisabled}
            trackColor={{ true: styles.switchTrack.color }}
            thumbColor={styles.switchThumb.color}
          />
        </View>
        {!biometricAvailable && !lockEnabled && (
          <Text style={styles.caveat}>
            Biometric authentication is not available on this device.
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Appearance</Text>
        <Button
          title="Toggle theme"
          onPress={toggleTheme}
          variant="secondary"
        />
      </View>

      <Button title="Lock" onPress={lock} disabled={!lockEnabled || updating} />
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    flex: 1,
    padding: 20,
    gap: 32,
  },
  section: {
    gap: 4,
  },
  sectionHeader: {
    fontFamily: fontFamilies.base.bold,
    fontSize: fontSize.xs,
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
    color: theme.mutedForeground,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
    gap: 12,
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontFamily: fontFamilies.base.medium,
    fontSize: fontSize.md,
    color: theme.foreground,
  },
  rowDesc: {
    fontFamily: fontFamilies.base.regular,
    fontSize: fontSize.sm,
    color: theme.mutedForeground,
    lineHeight: 18,
  },
  caveat: {
    fontFamily: fontFamilies.base.regular,
    fontSize: fontSize.xs,
    color: theme.mutedForeground,
    marginTop: 6,
  },
  switchTrack: {
    color: theme.primary,
  },
  switchThumb: {
    color: theme.primaryForeground,
  },
}));
