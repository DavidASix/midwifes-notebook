import { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";

import { db } from "@/db";
import { clients } from "@/db/schema";
import { useToggleTheme } from "@/lib/theme-context";

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
  return (
    NAMES[Math.floor(Math.random() * NAMES.length)] +
    " " +
    Math.floor(Math.random() * 9000 + 1000)
  );
}

export function ClientsTest() {
  const [data, setData] = useState<(typeof clients.$inferSelect)[]>([]);
  const [inserting, setInserting] = useState(false);
  const toggleTheme = useToggleTheme();

  const fetchClients = useCallback(async () => {
    setData(await db.select().from(clients));
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  async function insertClient() {
    setInserting(true);
    await db.insert(clients).values({ name: randomName() });
    await fetchClients();
    setInserting(false);
  }

  return (
    <View style={styles.container}>
      <Button
        title={inserting ? "Inserting…" : "Add test client"}
        onPress={insertClient}
        disabled={inserting}
        variant="primary"
      />
      <Button title="Toggle theme" onPress={toggleTheme} variant="secondary" />
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Text style={styles.row}>
            Found one! {item.id}. {item.name}
          </Text>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No clients yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: "100%", padding: 16, gap: 12 },
  row: { paddingVertical: 6, fontSize: 16 },
  empty: { color: "#888", fontStyle: "italic" },
});
