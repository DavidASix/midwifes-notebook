import { useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/Text";

export default function ClientDetailScreen() {
  const { client_id } = useLocalSearchParams<{ client_id: string }>();
  return (
    <View style={styles.container}>
      <Text>Client Detail — {client_id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
});
