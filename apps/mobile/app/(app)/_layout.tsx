import { Stack, router } from "expo-router";
import { Pressable } from "react-native";
import { ArrowBigLeft } from "lucide-react-native";
import { useTheme } from "@/lib/theme-context";
import { screenOptions } from "@/lib/themes";
import { useLock } from "@/lib/lock-context";

/**
 * Layout for the authenticated route group. Renders nothing until the DB is ready,
 * which is set in the root layout after the user authenticates and `initDb` resolves.
 */
export default function AppLayout() {
  const { dbReady } = useLock();
  const theme = useTheme();

  if (!dbReady) return null;

  return (
    <Stack
      screenOptions={{
        ...screenOptions(theme),
        headerLeft: () => (
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <ArrowBigLeft color={theme.primary} size={28} />
          </Pressable>
        ),
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
