import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { db } from "./src/db";
import migrations from "./drizzle/migrations";
import { ClientsTest } from "./src/components/ClientsTest";
import { useAppFonts } from "./src/hooks/useAppFonts";

export default function App() {
  const fontsLoaded = useAppFonts();
  const { success, error } = useMigrations(db, migrations);

  if (!fontsLoaded) return null;

  if (error) throw error;
  if (!success) return null;

  return (
    <View style={styles.container}>
      <ClientsTest />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 60,
  },
});
