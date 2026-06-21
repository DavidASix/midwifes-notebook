import { StatusBar } from "expo-status-bar";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Pressable } from "react-native";
import { ArrowBigLeft } from "lucide-react-native";

import { useAppFonts } from "@/hooks/useAppFonts";

import { ThemeProvider, useTheme } from "@/lib/theme-context";
import { screenOptions } from "@/lib/themes";
import { LockProvider } from "@/lib/lock-context";

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const theme = useTheme();
  return (
    <>
      <Stack
        initialRouteName={"onboarding"}
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
        <Stack.Screen name="lock" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={theme.statusBarIcons} />
    </>
  );
}

export default function RootLayout() {
  const fontsLoaded = useAppFonts();

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <LockProvider>
        <RootLayoutContent />
      </LockProvider>
    </ThemeProvider>
  );
}
