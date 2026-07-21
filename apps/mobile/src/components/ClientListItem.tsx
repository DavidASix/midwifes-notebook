import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { ChevronRight, ShieldPlus, UsersRound } from "lucide-react-native";

import { clients } from "@/db/schema";
import { deriveClientStatus, getClientDateSummary } from "@/lib/client-list";
import { makeStyles } from "@/lib/make-styles";
import { useTheme } from "@/lib/theme-context";
import { fontFamilies, fontSize, radius } from "@/lib/themes";

import { Text } from "@/components/ui/Text";

const statusLabels = {
  prenatal: "Prenatal",
  postpartum: "Postpartum",
  "out-of-care": "Out of Care",
} as const;

export function ClientListItem({
  client,
}: {
  client: typeof clients.$inferSelect;
}) {
  const styles = useStyles();
  const theme = useTheme();
  const status = deriveClientStatus(client);
  const { dateLabel, postpartumLabel } = getClientDateSummary(client);
  const gravidaParity =
    client.gravida != null || client.parity != null
      ? `G${client.gravida ?? "—"}P${client.parity ?? "—"}`
      : null;
  const hasDateLine = Boolean(dateLabel || postpartumLabel);
  const hasMetadata = Boolean(
    client.gbsStatus || gravidaParity || client.bloodType,
  );
  const supportingLines = Number(hasDateLine) + Number(hasMetadata);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${client.firstName} ${client.lastName}`}
      onPress={() => router.push(`/clients/${client.id}`)}
      style={({ pressed }) => [
        styles.container,
        { minHeight: 64 + supportingLines * 12 },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.headingRow}>
          <Text header numberOfLines={1} style={styles.name}>
            <Text header style={styles.lastName}>
              {client.lastName},
            </Text>{" "}
            <Text header style={styles.firstName}>
              {client.firstName}
            </Text>
          </Text>
          <View style={[styles.badge, styles[`${status}Badge`]]}>
            <Text style={[styles.badgeLabel, styles[`${status}Label`]]}>
              {statusLabels[status]}
            </Text>
          </View>
        </View>

        {hasDateLine && (
          <Text numberOfLines={1} style={styles.dateLine}>
            {dateLabel}
            {postpartumLabel ? ` · ${postpartumLabel}` : ""}
          </Text>
        )}

        {hasMetadata && (
          <View style={styles.metadata}>
            {client.gbsStatus && (
              <View style={styles.metadataItem}>
                <ShieldPlus
                  color={
                    client.gbsStatus === "+"
                      ? theme.destructive
                      : theme.secondary
                  }
                  size={16}
                />
                <Text style={styles.metadataText}>GBS{client.gbsStatus}</Text>
              </View>
            )}
            {gravidaParity && (
              <View style={styles.metadataItem}>
                <UsersRound color={theme.mutedForeground} size={16} />
                <Text style={styles.metadataText}>{gravidaParity}</Text>
              </View>
            )}
            {client.bloodType && (
              <Text style={styles.metadataText}>{client.bloodType}</Text>
            )}
          </View>
        )}
      </View>

      <ChevronRight color={theme.mutedForeground} size={22} />
    </Pressable>
  );
}

const useStyles = makeStyles((theme) => {
  const isDark = theme.statusBarIcons === "light";

  return {
    container: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.background,
    },
    pressed: {
      backgroundColor: theme.card,
    },
    content: {
      flex: 1,
      gap: 4,
    },
    headingRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 8,
    },
    name: {
      flex: 1,
      fontSize: fontSize.xl,
      lineHeight: 25,
    },
    lastName: {
      fontFamily: fontFamilies.heading.bold,
      color: theme.primary,
    },
    firstName: {
      fontFamily: fontFamilies.heading.regular,
      color: theme.mutedForeground,
    },
    dateLine: {
      color: theme.mutedForeground,
      fontSize: fontSize.sm,
      lineHeight: 18,
    },
    metadata: {
      minHeight: 18,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 12,
    },
    metadataItem: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 4,
    },
    metadataText: {
      color: theme.mutedForeground,
      fontSize: fontSize.sm,
    },
    badge: {
      borderRadius: radius["4xl"],
      paddingHorizontal: 9,
      paddingVertical: 4,
    },
    badgeLabel: {
      fontFamily: fontFamilies.base.bold,
      fontSize: 10,
      letterSpacing: 0.5,
      textTransform: "uppercase" as const,
    },
    prenatalBadge: {
      backgroundColor: isDark ? "#123f32" : "#d1fae5",
    },
    prenatalLabel: {
      color: isDark ? "#6ee7b7" : "#047857",
    },
    postpartumBadge: {
      backgroundColor: isDark ? "#172f52" : "#dbeafe",
    },
    postpartumLabel: {
      color: isDark ? "#93c5fd" : "#1d4ed8",
    },
    "out-of-careBadge": {
      backgroundColor: theme.muted,
    },
    "out-of-careLabel": {
      color: theme.mutedForeground,
    },
  };
});
