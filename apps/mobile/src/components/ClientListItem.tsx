import { StyleSheet } from "react-native";

import { clients } from "@/db/schema";

import { Text } from "@/components/ui/Text";

export function ClientListItem({
  client,
}: {
  client: typeof clients.$inferSelect;
}) {
  return (
    <Text style={styles.row}>
      Found one! {client.id}. {client.firstName} {client.lastName}
    </Text>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 6, fontSize: 16 },
});
