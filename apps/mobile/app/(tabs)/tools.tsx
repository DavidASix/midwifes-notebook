import { StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/Text";

export default function ToolsScreen() {
  return (
    <View style={styles.container}>
      <Text>Tools</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
});
