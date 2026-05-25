import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";

// import { db } from "../src/db";
// import migrations from "../drizzle/migrations";
import { useAppFonts } from "@/hooks/useAppFonts";
import { ThemeProvider, useTheme } from "@/lib/theme-context";

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.background,
            paddingTop: insets.top,
          },
        }}
      />
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
