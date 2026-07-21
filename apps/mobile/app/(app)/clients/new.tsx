import { StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { Text } from "@/components/ui/Text";

export default function NewClientScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "New Client",
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <View style={styles.container}>
        <Text>New Client</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
});
