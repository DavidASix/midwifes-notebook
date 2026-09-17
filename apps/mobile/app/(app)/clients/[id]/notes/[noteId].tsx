import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import { and, eq, isNull } from "drizzle-orm";
import {
  router,
  Stack,
  useLocalSearchParams,
  useNavigation,
} from "expo-router";

import { NoteForm } from "@/components/NoteForm";
import { StateView } from "@/components/ui/StateView";
import { getDb } from "@/db";
import { notes, notesSchema } from "@/db/schema";
import {
  buildNoteUpdate,
  noteToFormValues,
  type NoteFormErrors,
  type NoteFormValues,
} from "@/lib/note-form";
import { makeStyles } from "@/lib/make-styles";
import { parsePositiveIntegerRouteParam } from "@/lib/route-params";
import { useTheme } from "@/lib/theme-context";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

type NoteLoadState =
  | { status: "loading" }
  | { status: "loaded"; baseline: NoteFormValues }
  | { status: "invalid" }
  | { status: "missing" }
  | { status: "error" };

/** Edits and archives one client-owned note while protecting unsaved content. */
export default function EditNoteScreen() {
  const db = getDb();
  const styles = useStyles();
  const theme = useTheme();
  const navigation = useNavigation();
  const { id: routeId, noteId: routeNoteId } = useLocalSearchParams<{
    id?: string | string[];
    noteId?: string | string[];
  }>();
  const clientId = parsePositiveIntegerRouteParam(routeId);
  const noteId = parsePositiveIntegerRouteParam(routeNoteId);
  const leavingAllowed = useRef(false);
  const confirmationOpen = useRef(false);
  const mutationPending = useRef(false);
  const pendingNavigationAction =
    useRef<Parameters<typeof navigation.dispatch>[0]>(null);
  const [loadState, setLoadState] = useState<NoteLoadState>(() =>
    clientId == null || noteId == null
      ? { status: "invalid" }
      : { status: "loading" },
  );
  const [values, setValues] = useState<NoteFormValues>({
    title: "",
    content: "",
  });
  const [errors, setErrors] = useState<NoteFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const isMutationPending = isSubmitting || isArchiving;
  const isDirty = useMemo(
    () =>
      loadState.status === "loaded" &&
      JSON.stringify(values) !== JSON.stringify(loadState.baseline),
    [loadState, values],
  );

  /** Loads and validates the client-owned note before exposing it to the form. */
  const loadNote = useCallback(async () => {
    if (clientId == null || noteId == null) {
      setLoadState({ status: "invalid" });
      return;
    }
    setLoadState({ status: "loading" });
    try {
      const rows = await db
        .select()
        .from(notes)
        .where(
          and(
            eq(notes.id, noteId),
            eq(notes.clientId, clientId),
            isNull(notes.deletedAt),
          ),
        )
        .limit(1);
      if (!rows[0]) {
        setLoadState({ status: "missing" });
        return;
      }
      const parsed = notesSchema.safeParse(rows[0]);
      if (!parsed.success) {
        setLoadState({ status: "error" });
        return;
      }
      const baseline = noteToFormValues(parsed.data);
      setValues(baseline);
      setErrors({});
      setLoadState({ status: "loaded", baseline });
    } catch {
      setLoadState({ status: "error" });
    }
  }, [clientId, db, noteId]);

  useEffect(() => {
    void loadNote();
  }, [loadNote]);

  /** Confirms abandoning edits, then completes the pending navigation. */
  const confirmDiscard = useCallback(() => {
    if (confirmationOpen.current) return;
    confirmationOpen.current = true;
    /** Clears transient confirmation and navigation state. */
    const closeConfirmation = () => {
      confirmationOpen.current = false;
      pendingNavigationAction.current = null;
    };
    Alert.alert(
      "Discard your changes?",
      "Your unsaved note edits will be lost.",
      [
        { text: "Keep editing", style: "cancel", onPress: closeConfirmation },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            const pendingAction = pendingNavigationAction.current;
            leavingAllowed.current = true;
            closeConfirmation();
            if (pendingAction) navigation.dispatch(pendingAction);
            else router.back();
          },
        },
      ],
      { cancelable: true, onDismiss: closeConfirmation },
    );
  }, [navigation]);

  /** Routes explicit exits through dirty-form confirmation when necessary. */
  const requestLeave = useCallback(() => {
    if (mutationPending.current) return;
    if (isDirty) confirmDiscard();
    else router.back();
  }, [confirmDiscard, isDirty]);

  /** Intercepts native navigation while edits or mutations need protection. */
  useEffect(
    () =>
      navigation.addListener("beforeRemove", (event) => {
        if (leavingAllowed.current) return;
        if (mutationPending.current) {
          event.preventDefault();
          return;
        }
        if (!isDirty) return;
        event.preventDefault();
        pendingNavigationAction.current = event.data.action;
        confirmDiscard();
      }),
    [confirmDiscard, isDirty, navigation],
  );

  /** Updates one form field and clears its stale validation error. */
  function changeValue<K extends keyof NoteFormValues>(
    field: K,
    value: NoteFormValues[K],
  ) {
    if (mutationPending.current) return;
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  /** Validates and persists edits before returning to client detail. */
  async function submit() {
    if (clientId == null || noteId == null || mutationPending.current) return;
    const result = buildNoteUpdate(values);
    if (!result.success) {
      setErrors(result.errors);
      showErrorToast(
        "Add note content",
        "Write a note before saving this entry.",
      );
      return;
    }

    mutationPending.current = true;
    setIsSubmitting(true);
    setErrors({});
    try {
      const rows = await db
        .update(notes)
        .set({ ...result.data, updatedAt: new Date().toISOString() })
        .where(
          and(
            eq(notes.id, noteId),
            eq(notes.clientId, clientId),
            isNull(notes.deletedAt),
          ),
        )
        .returning();
      if (!notesSchema.safeParse(rows[0]).success) {
        throw new Error("Note update returned no valid record");
      }
      leavingAllowed.current = true;
      showSuccessToast("Note updated", "Changes were saved.");
      router.back();
    } catch {
      showErrorToast(
        "Couldn’t save note",
        "Your entry is still here. Please try again.",
      );
      mutationPending.current = false;
      setIsSubmitting(false);
    }
  }

  /** Requires confirmation before soft-deleting the note. */
  function requestArchive() {
    if (mutationPending.current) return;
    Alert.alert(
      "Delete this note?",
      "It will be hidden from the client record but remain stored locally.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete note",
          style: "destructive",
          onPress: () => void archiveNote(),
        },
      ],
    );
  }

  /** Soft-deletes the current note and returns to client detail. */
  async function archiveNote() {
    if (clientId == null || noteId == null || mutationPending.current) return;
    mutationPending.current = true;
    setIsArchiving(true);
    const timestamp = new Date().toISOString();
    try {
      const rows = await db
        .update(notes)
        .set({ deletedAt: timestamp, updatedAt: timestamp })
        .where(
          and(
            eq(notes.id, noteId),
            eq(notes.clientId, clientId),
            isNull(notes.deletedAt),
          ),
        )
        .returning();
      const parsed = notesSchema.safeParse(rows[0]);
      if (!parsed.success || parsed.data.deletedAt !== timestamp) {
        throw new Error("Note archive returned no valid record");
      }
      leavingAllowed.current = true;
      showSuccessToast("Note deleted", "The note remains stored locally.");
      router.back();
    } catch {
      showErrorToast(
        "Couldn’t delete note",
        "The note and your unsaved entries are still here. Please try again.",
      );
      mutationPending.current = false;
      setIsArchiving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          gestureEnabled: !isDirty && !isMutationPending,
          title: "Edit note",
        }}
      />
      {loadState.status === "loading" && (
        <StateView message="Loading note…">
          <ActivityIndicator color={theme.primary} />
        </StateView>
      )}
      {loadState.status === "invalid" && (
        <StateView
          action={() => router.back()}
          actionLabel="Go back"
          message="This note link does not contain valid record numbers."
          title="Invalid note"
        />
      )}
      {loadState.status === "missing" && (
        <StateView
          action={() => router.back()}
          actionLabel="Go back"
          message="This note may have been deleted."
          title="Note not found"
        />
      )}
      {loadState.status === "error" && (
        <StateView
          action={() => void loadNote()}
          actionLabel="Retry"
          message="Check the database and try again."
          title="Couldn’t load note"
        />
      )}
      {loadState.status === "loaded" && (
        <NoteForm
          errors={errors}
          isArchiving={isArchiving}
          isSubmitting={isSubmitting}
          mode="edit"
          onArchive={requestArchive}
          onCancel={requestLeave}
          onChange={changeValue}
          onSubmit={submit}
          values={values}
        />
      )}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: { flex: 1, backgroundColor: theme.background },
}));
