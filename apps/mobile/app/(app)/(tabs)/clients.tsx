import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { UserRoundPlus } from "lucide-react-native";

import { getDb } from "@/db";
import { clients } from "@/db/schema";
import { makeStyles } from "@/lib/make-styles";
import { useTheme } from "@/lib/theme-context";
import { fontFamilies, fontSize } from "@/lib/themes";

import { ClientListItem } from "@/components/ClientListItem";
import { Text } from "@/components/ui/Text";

export function HeaderRightButton() {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add client"
      onPress={() => router.push("/clients/new")}
      style={styles.headerButton}
    >
      <UserRoundPlus color={theme.primary} size={26} />
    </Pressable>
  );
}

export default function ClientsScreen() {
  const db = getDb();
  const styles = useStyles();
  const [data, setData] = useState<(typeof clients.$inferSelect)[]>([]);

  const fetchClients = useCallback(async () => {
    setData(await db.select().from(clients));
  }, [db]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <ClientListItem client={item} />}
        contentContainerStyle={data.length === 0 ? styles.emptyList : undefined}
        ListEmptyComponent={<Text style={styles.empty}>No clients yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerButton: { paddingHorizontal: 16, paddingVertical: 4 },
});

const useStyles = makeStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  emptyList: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  empty: {
    color: theme.mutedForeground,
    fontFamily: fontFamilies.base.regular,
    fontSize: fontSize.md,
    fontStyle: "italic" as const,
  },
}));
