import { Stack } from "expo-router";
import { useTheme } from "@/lib/theme-context";

export default function StatisticsLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    />
  );
}
