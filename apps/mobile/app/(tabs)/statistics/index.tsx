import { StyleSheet, View } from "react-native";
import { Text } from "../../../src/components/ui/Text";

export default function StatisticsScreen() {
  return (
    <View style={styles.container}>
      <Text>Statistics</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
});
