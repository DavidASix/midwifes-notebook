import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { db } from "./src/db";
import migrations from "./drizzle/migrations";
import { ClientsTest } from "./src/components/ClientsTest";
import { useAppFonts } from "./src/hooks/useAppFonts";
import { ThemeProvider, useTheme } from "./src/lib/theme-context";
import { makeStyles } from "./src/lib/make-styles";

const useStyles = makeStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    paddingTop: 30,
  },
}));

function AppContent() {
  const styles = useStyles();
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <ClientsTest />
      <StatusBar style={theme.statusBarIcons} />
    </View>
  );
}

export default function App() {
  const fontsLoaded = useAppFonts();
  const { success, error } = useMigrations(db, migrations);

  if (!fontsLoaded) return null;
  if (error) throw error;
  if (!success) return null;

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
