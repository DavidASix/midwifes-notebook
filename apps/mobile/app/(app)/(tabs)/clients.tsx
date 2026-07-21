import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { getDb } from "@/db";
import { clients } from "@/db/schema";
import { useTheme, useToggleTheme } from "@/lib/theme-context";

import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";

const NAMES = [
  "Alice",
  "Betty",
  "Clara",
  "Diana",
  "Elena",
  "Fiona",
  "Grace",
  "Hannah",
  "Iris",
  "Julia",
];

function randomName() {
  return {
    firstName: NAMES[Math.floor(Math.random() * NAMES.length)],
    lastName: String(Math.floor(Math.random() * 9000 + 1000)),
  };
}

export function HeaderRightButton() {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => router.push("/clients/new")}
      style={styles.headerButton}
    >
      <Text style={{ color: theme.primary, fontSize: 28, lineHeight: 30 }}>
        +
      </Text>
    </Pressable>
  );
}

export default function ClientsScreen() {
  const db = getDb();
  const [data, setData] = useState<(typeof clients.$inferSelect)[]>([]);
  const [inserting, setInserting] = useState(false);
  const toggleTheme = useToggleTheme();

  const fetchClients = useCallback(async () => {
    setData(await db.select().from(clients));
  }, [db]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  async function insertClient() {
    setInserting(true);
    await db.insert(clients).values(randomName());
    await fetchClients();
    setInserting(false);
  }

  return (
    <View style={styles.container}>
      <Text>Clients</Text>
      <View style={styles.listContainer}>
        <Button
          title={inserting ? "Inserting…" : "Add test client"}
          onPress={insertClient}
          disabled={inserting}
          variant="primary"
        />
        <Button
          title="Toggle theme"
          onPress={toggleTheme}
          variant="secondary"
        />
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <Text style={styles.row}>
              Found one! {item.id}. {item.firstName} {item.lastName}
            </Text>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No clients yet.</Text>}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerButton: { paddingHorizontal: 16 },
  listContainer: { flex: 1, width: "100%", padding: 16, gap: 12 },
  row: { paddingVertical: 6, fontSize: 16 },
  empty: { color: "#888", fontStyle: "italic" },
});
