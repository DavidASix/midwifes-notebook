import { Stack } from "expo-router";
import { useTheme } from "../../../src/lib/theme-context";

export default function ClientsLayout() {
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
