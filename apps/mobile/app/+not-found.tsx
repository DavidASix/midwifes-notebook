import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Text } from "../src/components/ui/Text";

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View style={styles.container}>
        <Text>Not Found</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
});
