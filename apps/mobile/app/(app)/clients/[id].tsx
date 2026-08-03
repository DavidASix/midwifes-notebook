import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { and, eq, isNull } from "drizzle-orm";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { Pencil, X } from "lucide-react-native";

import {
  ClientDetailContent,
  parseClientId,
} from "@/components/ClientDetailContent";
import { Button } from "@/components/ui/Button";
import { SlideUpScreen } from "@/components/ui/SlideUpScreen";
import { Text } from "@/components/ui/Text";
import { getDb } from "@/db";
import { clientsSchema, clients } from "@/db/schema";
import { useSlideUpScreen } from "@/hooks/useSlideUpScreen";
import { getClientFullName, type ClientRecord } from "@/lib/client-detail";
import { makeStyles } from "@/lib/make-styles";
import { useTheme } from "@/lib/theme-context";
import { fontFamilies, fontSize } from "@/lib/themes";

type ClientLoadState =
  | { status: "loading" }
  | { status: "loaded"; client: ClientRecord }
  | { status: "invalid" }
  | { status: "missing" }
  | { status: "error" };

export default function ClientDetailScreen() {
  const db = getDb();
  const { id: routeId } = useLocalSearchParams<{
    id?: string | string[];
  }>();
  const clientId = parseClientId(routeId);
  const styles = useStyles();
  const theme = useTheme();
  const sheet = useSlideUpScreen();
  const requestVersion = useRef(0);
  const [loadState, setLoadState] = useState<ClientLoadState>(() =>
    clientId == null ? { status: "invalid" } : { status: "loading" },
  );

  const loadClient = useCallback(async () => {
    const version = ++requestVersion.current;
    if (clientId == null) {
      setLoadState({ status: "invalid" });
      return;
    }

    setLoadState({ status: "loading" });
    try {
      const result = await db
        .select()
        .from(clients)
        .where(and(eq(clients.id, clientId), isNull(clients.deletedAt)))
        .limit(1);
      if (version !== requestVersion.current) return;
      if (!result[0]) {
        setLoadState({ status: "missing" });
        return;
      }

      const parsedClient = clientsSchema.safeParse(result[0]);
      setLoadState(
        parsedClient.success
          ? { status: "loaded", client: parsedClient.data }
          : { status: "error" },
      );
    } catch {
      if (version === requestVersion.current) {
        setLoadState({ status: "error" });
      }
    }
  }, [clientId, db]);

  useFocusEffect(
    useCallback(() => {
      void loadClient();
      return () => {
        requestVersion.current += 1;
      };
    }, [loadClient]),
  );

  const title =
    loadState.status === "loaded"
      ? getClientFullName(loadState.client)
      : "Client details";

  return (
    <SlideUpScreen controller={sheet}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Button
            accessibilityLabel="Close client details"
            onPress={sheet.requestDismiss}
            size="bare"
            style={styles.headerButton}
            variant="ghost"
          >
            <X color={theme.primary} size={24} />
          </Button>
          <Text header numberOfLines={1} style={styles.title}>
            {title}
          </Text>
          <Button
            accessibilityLabel="Edit client"
            onPress={() => {
              // TODO: Navigate to the shared create/edit client form route.
            }}
            size="bare"
            style={styles.editButton}
            variant="ghost"
          >
            <Pencil color={theme.primary} size={16} />
            <Text style={styles.editLabel}>Edit</Text>
          </Button>
        </View>

        {loadState.status === "loading" && (
          <View style={styles.centeredState}>
            <ActivityIndicator color={theme.primary} />
            <Text style={styles.stateText}>Loading client…</Text>
          </View>
        )}
        {loadState.status === "invalid" && (
          <View style={styles.centeredState}>
            <Text header style={styles.stateTitle}>
              Invalid client
            </Text>
            <Text style={styles.stateText}>
              This client link does not contain a valid record number.
            </Text>
          </View>
        )}
        {loadState.status === "missing" && (
          <View style={styles.centeredState}>
            <Text header style={styles.stateTitle}>
              Client not found
            </Text>
            <Text style={styles.stateText}>
              This client may have been removed.
            </Text>
          </View>
        )}
        {loadState.status === "error" && (
          <View style={styles.centeredState}>
            <Text header style={styles.stateTitle}>
              Couldn’t load client
            </Text>
            <Text style={styles.stateText}>
              Check the database and try again.
            </Text>
            <Button onPress={() => void loadClient()} title="Retry" />
          </View>
        )}
        {loadState.status === "loaded" && (
          <ClientDetailContent client={loadState.client} />
        )}
      </View>
    </SlideUpScreen>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    flex: 1,
  },
  header: {
    minHeight: 56,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerButton: {
    width: 44,
  },
  title: {
    flex: 1,
    color: theme.foreground,
    fontFamily: fontFamilies.heading.bold,
    fontSize: fontSize.xl,
    textAlign: "center",
  },
  editButton: {
    width: 58,
    flexDirection: "row",
    gap: 5,
  },
  editLabel: {
    color: theme.primary,
    fontFamily: fontFamilies.base.bold,
    fontSize: fontSize.xs,
    textTransform: "uppercase",
  },
  centeredState: {
    flex: 1,
    padding: 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  stateTitle: {
    color: theme.primary,
    fontFamily: fontFamilies.heading.bold,
    fontSize: fontSize["2xl"],
    textAlign: "center",
  },
  stateText: {
    maxWidth: 300,
    color: theme.mutedForeground,
    fontSize: fontSize.md,
    lineHeight: 22,
    textAlign: "center",
  },
}));
