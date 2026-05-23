import { useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { db } from "../db";
import { clients } from "../db/schema";
import { Button } from "./ui/Button";

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
  const { data } = useLiveQuery(db.select().from(clients));
  const [inserting, setInserting] = useState(false);

  async function insertClient() {
    setInserting(true);
    await db.insert(clients).values({ name: randomName() });
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
