import { Stack, router, Redirect } from "expo-router";
import { Pressable } from "react-native";
import { ArrowBigLeft } from "lucide-react-native";
import { useTheme } from "@/lib/theme-context";
import { screenOptions } from "@/lib/themes";
import { useLock } from "@/lib/lock-context";

/**
 * Layout for the authenticated route group
 */
export default function AppLayout() {
  const theme = useTheme();
  const { isLocked } = useLock();

  if (isLocked) {
    return <Redirect href="/lock" />;
  }

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
