import { Tabs } from "expo-router";
import { useTheme } from "@/lib/theme-context";

export default function TabsLayout() {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
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
