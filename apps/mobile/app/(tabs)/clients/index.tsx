import { StyleSheet, View } from "react-native";
import { Text } from "../../../src/components/ui/Text";
import { ClientsTest } from "../../../src/components/ClientsTest";

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
});
