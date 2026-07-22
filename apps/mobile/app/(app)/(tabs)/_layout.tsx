import { Tabs } from "expo-router";
import { useTheme } from "@/lib/theme-context";
import { fontFamilies, fontSize, screenOptions } from "@/lib/themes";
import { HeaderRightButton as ToolsHeaderRight } from "./tools";
import { HeaderRightButton as CalendarHeaderRight } from "./calendar";
import { HeaderRightButton as StatisticsHeaderRight } from "./statistics";

export default function TabsLayout() {
  const theme = useTheme();
  return (
    <Tabs screenOptions={{ headerShown: true, ...screenOptions(theme) }}>
      <Tabs.Screen
        name="tools"
        options={{ title: "Tools", headerRight: () => <ToolsHeaderRight /> }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: "Clients",
          headerTitleStyle: {
            color: theme.primary,
            fontFamily: fontFamilies.heading.bold,
            fontSize: fontSize["3xl"],
          },
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          headerRight: () => <CalendarHeaderRight />,
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: "Statistics",
          headerRight: () => <StatisticsHeaderRight />,
        }}
      />
    </Tabs>
  );
}
