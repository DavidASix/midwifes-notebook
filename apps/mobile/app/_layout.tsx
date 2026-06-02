import { StatusBar } from "expo-status-bar";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
// import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";

// import { db } from "../src/db";
// import migrations from "../drizzle/migrations";
import { Pressable } from "react-native";
import { ArrowBigLeft } from "lucide-react-native";
import { useAppFonts } from "@/hooks/useAppFonts";
import { ThemeProvider, useTheme } from "@/lib/theme-context";
import { screenOptions } from "@/lib/themes";
import LockScreen from "@/components/LockScreen";
import { LockProvider, useLock } from "@/lib/lock-context";

/** Dev utility — set true to skip onboarding and land directly on tabs. */
export const SKIP_ONBOARDING = false;

/** Dev utility — set true to require authentication before the app is accessible. */
export const SHOW_AUTHENTICATION = true;

/** Returns the first route the root Stack should render */
function getInitialRouteName(): "(tabs)" | "onboarding" {
  return SKIP_ONBOARDING ? "(tabs)" : "onboarding";
}

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const theme = useTheme();
  const { isLocked, unlock } = useLock();

  if (isLocked) {
    return (
      <>
        <LockScreen onAuthenticated={unlock} />
        <StatusBar style={theme.statusBarIcons} />
      </>
    );
  }

  return (
    <>
      <Stack
        initialRouteName={getInitialRouteName()}
        screenOptions={{
          ...screenOptions(theme),
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <ArrowBigLeft color={theme.primary} size={28} />
            </Pressable>
          ),
        }}
      >
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={theme.statusBarIcons} />
    </>
  );
}

export default function RootLayout() {
  const fontsLoaded = useAppFonts();
  // const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;
  // if (error) throw error;
  // if (!success) return null;

  return (
    <ThemeProvider>
      <LockProvider initiallyLocked={SHOW_AUTHENTICATION}>
        <RootLayoutContent />
      </LockProvider>
    </ThemeProvider>
  );
}
