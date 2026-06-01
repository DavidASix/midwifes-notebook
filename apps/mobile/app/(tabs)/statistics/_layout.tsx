import { Stack } from "expo-router";
import { useTheme } from "@/lib/theme-context";
import { screenOptions } from "@/lib/themes";

export default function StatisticsLayout() {
  const theme = useTheme();
  return <Stack screenOptions={screenOptions(theme)} />;
}
