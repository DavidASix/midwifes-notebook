import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Text } from "@/components/ui/Text";
import { ClientsTest } from "@/components/ClientsTest";
import { useTheme } from "@/lib/theme-context";

export function HeaderRightButton() {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => router.push("/clients/new")}
      style={styles.headerButton}
    >
      <Text style={{ color: theme.primary, fontSize: 28, lineHeight: 30 }}>
        +
      </Text>
    </Pressable>
  );
}

export default function ClientsScreen() {
  return (
    <View style={styles.container}>
      <Text>Clients</Text>
      <ClientsTest />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerButton: { paddingHorizontal: 16 },
});
