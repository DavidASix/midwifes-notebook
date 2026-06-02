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

/** Dev utility — set true to skip onboarding and land directly on tabs. */
export const SKIP_ONBOARDING = false;

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const theme = useTheme();
  return (
    <>
      <Stack
        initialRouteName={SKIP_ONBOARDING ? "(tabs)" : "onboarding"}
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
      <RootLayoutContent />
    </ThemeProvider>
  );
}
