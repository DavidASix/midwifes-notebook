import { Tabs } from "expo-router";
import { useTheme } from "@/lib/theme-context";
import { screenOptions } from "@/lib/themes";

export default function TabsLayout() {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        ...screenOptions(theme),
      }}
    >
      <Tabs.Screen name="tools" options={{ title: "Tools" }} />
      <Tabs.Screen
        name="clients"
        options={{ title: "Clients", headerShown: false }}
      />
      <Tabs.Screen name="calendar" options={{ title: "Calendar" }} />
      <Tabs.Screen
        name="statistics"
        options={{ title: "Statistics", headerShown: false }}
      />
    </Tabs>
  );
}
