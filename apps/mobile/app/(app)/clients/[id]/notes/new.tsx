import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, View } from "react-native";
import { and, eq, isNull } from "drizzle-orm";
import {
  router,
  Stack,
  useLocalSearchParams,
  useNavigation,
} from "expo-router";

import { NoteForm } from "@/components/NoteForm";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { getDb } from "@/db";
import { clients, clientsSchema, notes, notesSchema } from "@/db/schema";
import {
  buildNoteInsert,
  initialNoteFormValues,
  type NoteFormErrors,
  type NoteFormValues,
} from "@/lib/note-form";
import { makeStyles } from "@/lib/make-styles";
import { parsePositiveIntegerRouteParam } from "@/lib/route-params";
import { fontFamilies, fontSize } from "@/lib/themes";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

/** Creates a note for one client while protecting unsaved form content. */
export default function NewNoteScreen() {
  const db = getDb();
  const styles = useStyles();
  const navigation = useNavigation();
  const { id: routeId } = useLocalSearchParams<{ id?: string | string[] }>();
  const clientId = parsePositiveIntegerRouteParam(routeId);
  const leavingAllowed = useRef(false);
  const confirmationOpen = useRef(false);
  const mutationPending = useRef(false);
  const pendingNavigationAction =
    useRef<Parameters<typeof navigation.dispatch>[0]>(null);
  const [values, setValues] = useState<NoteFormValues>(initialNoteFormValues);
  const [errors, setErrors] = useState<NoteFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(initialNoteFormValues),
    [values],
  );

  /** Confirms abandoning a draft, then completes the pending navigation. */
  const confirmDiscard = useCallback(() => {
    if (confirmationOpen.current) return;
    confirmationOpen.current = true;
    /** Clears transient confirmation and navigation state. */
    const closeConfirmation = () => {
      confirmationOpen.current = false;
      pendingNavigationAction.current = null;
    };
    Alert.alert(
      "Discard this note?",
      "Your changes have not been saved.",
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

  /** Routes explicit exits through draft confirmation when necessary. */
  const requestLeave = useCallback(() => {
    if (mutationPending.current) return;
    if (isDirty) confirmDiscard();
    else router.back();
  }, [confirmDiscard, isDirty]);

  /** Intercepts native navigation while a draft or mutation needs protection. */
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

  /** Validates and persists the note before returning to client detail. */
  async function submit() {
    if (clientId == null || mutationPending.current) return;
    const result = buildNoteInsert(clientId, values);
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
      const clientRows = await db
        .select()
        .from(clients)
        .where(and(eq(clients.id, clientId), isNull(clients.deletedAt)))
        .limit(1);
      if (!clientsSchema.safeParse(clientRows[0]).success) {
        throw new Error("Client is unavailable");
      }
      const rows = await db.insert(notes).values(result.data).returning();
      if (!notesSchema.safeParse(rows[0]).success) {
        throw new Error("Note insert returned no valid record");
      }
      leavingAllowed.current = true;
      showSuccessToast("Note added", "The note was saved to this client.");
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

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          gestureEnabled: !isDirty && !isSubmitting,
          title: "New note",
        }}
      />
      {clientId == null ? (
        <View style={styles.centeredState}>
          <Text header style={styles.stateTitle}>
            Invalid client
          </Text>
          <Text style={styles.stateText}>
            This note link does not contain a valid client record number.
          </Text>
          <Button onPress={() => router.back()} title="Go back" />
        </View>
      ) : (
        <NoteForm
          errors={errors}
          isSubmitting={isSubmitting}
          mode="create"
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
  container: {
    flex: 1,
    backgroundColor: theme.background,
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
