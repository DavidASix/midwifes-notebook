import { Tabs } from "expo-router";
import { useTheme } from "@/lib/theme-context";
import { fontFamilies, fontSize } from "@/lib/themes";

export default function TabsLayout() {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.primary,
        headerTitleStyle: {
          fontFamily: fontFamilies.heading,
          fontSize: fontSize["4xl"],
          color: theme.foreground,
        },
        headerShadowVisible: true,
        sceneStyle: { backgroundColor: theme.background },
      }}
    >
      <Tabs.Screen name="tools" options={{ title: "Tools" }} />
      <Tabs.Screen name="clients" options={{ title: "Clients" }} />
      <Tabs.Screen name="calendar" options={{ title: "Calendar" }} />
      <Tabs.Screen name="statistics" options={{ title: "Statistics" }} />
    </Tabs>
  );
}
