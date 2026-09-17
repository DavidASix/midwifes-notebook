import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { and, desc, eq, isNull } from "drizzle-orm";
import { router, useFocusEffect } from "expo-router";
import { ChevronRight, FileText, Plus } from "lucide-react-native";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { getDb } from "@/db";
import { notes, notesSchema, type NoteRecord } from "@/db/schema";
import { formatTimestamp } from "@/lib/dates";
import { makeStyles } from "@/lib/make-styles";
import { useTheme } from "@/lib/theme-context";
import { fontFamilies, fontSize } from "@/lib/themes";

type NotesLoadState =
  | { status: "loading" }
  | { status: "loaded"; notes: NoteRecord[] }
  | { status: "error" };

/** Loads and displays one client's active notes inside the Client Detail pager. */
export function ClientNotesPage({
  active,
  clientId,
  width,
}: {
  active: boolean;
  clientId: number;
  width: number;
}) {
  const styles = useStyles();
  const theme = useTheme();
  const requestVersion = useRef(0);
  const [loadState, setLoadState] = useState<NotesLoadState>({
    status: "loading",
  });

  /** Loads and validates the client's current non-archived notes. */
  const loadNotes = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoadState({ status: "loading" });
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(notes)
        .where(and(eq(notes.clientId, clientId), isNull(notes.deletedAt)))
        .orderBy(desc(notes.createdAt), desc(notes.id));
      if (version !== requestVersion.current) return;
      const parsed = z.array(notesSchema).safeParse(rows);
      setLoadState(
        parsed.success
          ? { status: "loaded", notes: parsed.data }
          : { status: "error" },
      );
    } catch {
      if (version === requestVersion.current) {
        setLoadState({ status: "error" });
      }
    }
  }, [clientId]);

  /** Refreshes notes whenever the active notes tab regains route focus. */
  const refreshNotesOnFocus = useCallback(() => {
    if (!active) return;
    void loadNotes();
    return () => {
      requestVersion.current += 1;
    };
  }, [active, loadNotes]);

  useFocusEffect(refreshNotesOnFocus);

  return (
    <BottomSheetScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={{ width }}
    >
      <View style={styles.toolbar}>
        <View>
          <Text header style={styles.heading}>
            Client notes
          </Text>
          <Text style={styles.subheading}>Newest first</Text>
        </View>
        <Button
          icon={<Plus color={theme.primaryForeground} size={17} />}
          onPress={() => router.push(`/clients/${clientId}/notes/new`)}
          size="compact"
          title="New note"
        />
      </View>

      {loadState.status === "loading" && (
        <View style={styles.state}>
          <ActivityIndicator color={theme.primary} />
          <Text style={styles.stateCopy}>Loading notes…</Text>
        </View>
      )}

      {loadState.status === "error" && (
        <View style={styles.state}>
          <Text header style={styles.stateTitle}>
            Couldn’t load notes
          </Text>
          <Text style={styles.stateCopy}>
            Check the database and try again.
          </Text>
          <Button onPress={() => void loadNotes()} title="Retry" />
        </View>
      )}

      {loadState.status === "loaded" && loadState.notes.length === 0 && (
        <View style={styles.state}>
          <View style={styles.emptyIcon}>
            <FileText color={theme.primary} size={25} />
          </View>
          <Text header style={styles.stateTitle}>
            No notes yet
          </Text>
          <Text style={styles.stateCopy}>
            Add visit details, updates, or reminders for this client.
          </Text>
        </View>
      )}

      {loadState.status === "loaded" && loadState.notes.length > 0 && (
        <View style={styles.list}>
          {loadState.notes.map((note) => (
            <Button
              accessibilityLabel={`Open ${note.title || "untitled note"}`}
              key={note.id}
              onPress={() =>
                router.push(`/clients/${clientId}/notes/${note.id}`)
              }
              size="bare"
              style={styles.row}
              variant="ghost"
            >
              <View style={styles.rowCopy}>
                {note.title && (
                  <Text numberOfLines={1} style={styles.noteTitle}>
                    {note.title}
                  </Text>
                )}
                <Text style={styles.timestamp}>
                  {formatTimestamp(note.createdAt)}
                </Text>
                <Text numberOfLines={8} style={styles.preview}>
                  {note.content}
                </Text>
              </View>
              <ChevronRight color={theme.mutedForeground} size={20} />
            </Button>
          ))}
        </View>
      )}
    </BottomSheetScrollView>
  );
}

const useStyles = makeStyles((theme) => ({
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 32,
  },
  toolbar: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  heading: {
    color: theme.foreground,
    fontFamily: fontFamilies.heading.bold,
    fontSize: fontSize.xl,
  },
  subheading: {
    marginTop: 1,
    color: theme.mutedForeground,
    fontSize: fontSize.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  list: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  row: {
    minHeight: 96,
    paddingVertical: 14,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    borderRadius: 0,
  },
  rowCopy: {
    flex: 1,
    alignItems: "flex-start",
    gap: 3,
  },
  noteTitle: {
    width: "100%",
    color: theme.foreground,
    fontFamily: fontFamilies.base.semiBold,
    fontSize: fontSize.md,
  },
  timestamp: {
    color: theme.mutedForeground,
    fontSize: fontSize.xs,
  },
  preview: {
    width: "100%",
    color: theme.foreground,
    fontSize: fontSize.sm,
    lineHeight: 19,
  },
  state: {
    minHeight: 310,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 11,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor: theme.accent,
  },
  stateTitle: {
    color: theme.primary,
    fontFamily: fontFamilies.heading.bold,
    fontSize: fontSize.xl,
    textAlign: "center",
  },
  stateCopy: {
    maxWidth: 280,
    color: theme.mutedForeground,
    fontSize: fontSize.sm,
    lineHeight: 20,
    textAlign: "center",
  },
}));
