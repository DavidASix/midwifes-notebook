import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Text } from "react-native";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { db } from "./src/db";
import migrations from "./drizzle/migrations";

export default function App() {
  const { success, error } = useMigrations(db, migrations);

  if (error) throw error;
  if (!success) return null;

  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
