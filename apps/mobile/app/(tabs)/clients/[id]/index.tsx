import { useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/Text";

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View style={styles.container}>
      <Text>Client Detail — {id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
});
