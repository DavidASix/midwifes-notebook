import { StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { useLock } from "@/lib/lock-context";

export default function SettingsScreen() {
  const { lock } = useLock();

  return (
    <View style={styles.container}>
      <Text>Settings</Text>
      <Button title="Lock" onPress={lock} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
});
