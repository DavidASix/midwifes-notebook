import { Stack } from "expo-router";
import { useTheme } from "@/lib/theme-context";
import { fontFamilies, fontSize } from "@/lib/themes";

export default function ClientsLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.primary,
        headerTitleStyle: {
          fontFamily: fontFamilies.heading.bold,
          fontSize: fontSize["3xl"],
          color: theme.foreground,
        },
        headerShadowVisible: true,
        contentStyle: { backgroundColor: theme.background },
      }}
    />
  );
}
