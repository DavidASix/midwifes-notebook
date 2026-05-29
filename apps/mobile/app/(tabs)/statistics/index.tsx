import { Pressable, StyleSheet, View } from "react-native";
import { router, Stack } from "expo-router";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/lib/theme-context";

export default function StatisticsScreen() {
  const theme = useTheme();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Statistics",
          headerRight: () => (
            <Pressable
              onPress={() => router.push("/statistics/settings")}
              style={styles.headerButton}
            >
              <Text style={{ color: theme.primary, fontSize: 20 }}>⚙</Text>
            </Pressable>
          ),
        }}
      />
      <View style={styles.container}>
        <Text>Statistics</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerButton: { paddingHorizontal: 16 },
});
