import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/lib/theme-context";

export function HeaderRightButton() {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => router.push("/settings")}
      style={styles.headerButton}
    >
      <Text style={{ color: theme.primary, fontSize: 20 }}>⚙</Text>
    </Pressable>
  );
}

export default function StatisticsScreen() {
  return (
    <View style={styles.container}>
      <Text>Statistics</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerButton: { paddingHorizontal: 16 },
});
