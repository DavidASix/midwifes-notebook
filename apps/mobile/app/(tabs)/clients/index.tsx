import { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { Text } from "@/components/ui/Text";
import { ClientsTest } from "@/components/ClientsTest";
import { useTheme } from "@/lib/theme-context";

export default function ClientsScreen() {
  const theme = useTheme();

  const handleAdd = useCallback(() => {
    // TODO: open add client sheet
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Clients",
          headerRight: () => (
            <Pressable onPress={handleAdd} style={styles.headerButton}>
              <Text
                style={{ color: theme.primary, fontSize: 28, lineHeight: 30 }}
              >
                +
              </Text>
            </Pressable>
          ),
        }}
      />
      <View style={styles.container}>
        <Text>Clients</Text>
        <ClientsTest />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerButton: { paddingHorizontal: 16 },
});
