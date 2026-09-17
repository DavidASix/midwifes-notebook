import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, View } from "react-native";
import { and, eq, isNull } from "drizzle-orm";
import {
  router,
  Stack,
  useLocalSearchParams,
  useNavigation,
} from "expo-router";
import { ArrowBigLeft } from "lucide-react-native";

import { ClientForm } from "@/components/ClientForm";
import { StateView } from "@/components/ui/StateView";
import { getDb } from "@/db";
import { clients, clientsSchema } from "@/db/schema";
import {
  buildClientUpdate,
  clientToFormValues,
  type ClientFormErrors,
  type ClientFormValues,
} from "@/lib/client-form";
import { makeStyles } from "@/lib/make-styles";
import { parsePositiveIntegerRouteParam } from "@/lib/route-params";
import { useTheme } from "@/lib/theme-context";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

type EditLoadState =
  | { status: "loading" }
  | { status: "loaded"; baseline: ClientFormValues }
  | { status: "invalid" }
  | { status: "missing" }
  | { status: "error" };

/** Loads and edits one active client while protecting unsaved changes and lifecycle mutations. */
export default function EditClientScreen() {
  const db = getDb();
  const navigation = useNavigation();
  const { id: routeId } = useLocalSearchParams<{ id?: string | string[] }>();
  const clientId = parsePositiveIntegerRouteParam(routeId);
  const styles = useStyles();
  const theme = useTheme();
  const leavingAllowed = useRef(false);
  const confirmationOpen = useRef(false);
  const mutationPending = useRef(false);
  const pendingNavigationAction =
    useRef<Parameters<typeof navigation.dispatch>[0]>(null);
  const [loadState, setLoadState] = useState<EditLoadState>(() =>
    clientId == null ? { status: "invalid" } : { status: "loading" },
  );
  const [values, setValues] = useState<ClientFormValues>({});
  const [errors, setErrors] = useState<ClientFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const isMutationPending = isSubmitting || isArchiving;

  const isDirty = useMemo(
    () =>
      loadState.status === "loaded" &&
      JSON.stringify(values) !== JSON.stringify(loadState.baseline),
    [loadState, values],
  );

  /** Loads and validates the route's non-archived client before exposing it to the form. */
  const loadClient = useCallback(async () => {
    if (clientId == null) {
      setLoadState({ status: "invalid" });
      return;
    }
    setLoadState({ status: "loading" });
    try {
      const rows = await db
        .select()
        .from(clients)
        .where(and(eq(clients.id, clientId), isNull(clients.deletedAt)))
        .limit(1);
      if (!rows[0]) {
        setLoadState({ status: "missing" });
        return;
      }
      const parsed = clientsSchema.safeParse(rows[0]);
      if (!parsed.success) {
        setLoadState({ status: "error" });
        return;
      }
      const baseline = clientToFormValues(parsed.data);
      setValues(baseline);
      setErrors({});
      setLoadState({ status: "loaded", baseline });
    } catch {
      setLoadState({ status: "error" });
    }
  }, [clientId, db]);

  useEffect(() => {
    void loadClient();
  }, [loadClient]);

  /** Confirms abandoning edits, then completes the navigation that originally requested removal. */
  const confirmDiscard = useCallback(() => {
    if (confirmationOpen.current) return;
    confirmationOpen.current = true;
    /** Resets confirmation state after either alert choice. */
    const closeConfirmation = () => {
      confirmationOpen.current = false;
      pendingNavigationAction.current = null;
    };
    Alert.alert(
      "Discard your changes?",
      "Your unsaved edits will be lost.",
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

  /** Routes explicit exits through the dirty-form confirmation when needed. */
  const requestLeave = useCallback(() => {
    if (mutationPending.current) return;
    if (isDirty) confirmDiscard();
    else router.back();
  }, [confirmDiscard, isDirty]);

  /** Intercepts navigator removals until dirty edits are explicitly discarded. */
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
  function changeValue<K extends keyof ClientFormValues>(
    field: K,
    value: ClientFormValues[K],
  ) {
    if (mutationPending.current) return;
    setValues((current) => ({
      ...current,
      [field]: value === "" ? undefined : value,
    }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  /** Validates and persists edits before returning to client detail. */
  async function submit() {
    if (clientId == null || mutationPending.current) return;
    const result = buildClientUpdate(values);
    if (!result.success) {
      setErrors(result.errors);
      showErrorToast(
        "Review highlighted fields",
        "Correct the highlighted fields and try again.",
      );
      return;
    }

    mutationPending.current = true;
    setIsSubmitting(true);
    setErrors({});
    try {
      const rows = await db
        .update(clients)
        .set({ ...result.data, updatedAt: new Date().toISOString() })
        .where(and(eq(clients.id, clientId), isNull(clients.deletedAt)))
        .returning();
      if (!clientsSchema.safeParse(rows[0]).success) {
        throw new Error("Client update returned no valid record");
      }
      leavingAllowed.current = true;
      showSuccessToast("Client updated", "Changes were saved.");
      router.back();
    } catch {
      showErrorToast(
        "Couldn't save client",
        "Your entries are still here. Please try again.",
      );
      mutationPending.current = false;
      setIsSubmitting(false);
    }
  }

  /** Requires explicit confirmation before starting the archive mutation. */
  function requestArchive() {
    if (mutationPending.current) return;
    Alert.alert(
      "Delete this client?",
      "They will remain stored locally and may be restored in future, but will no longer appear in your client list.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete client",
          style: "destructive",
          onPress: () => void archiveClient(),
        },
      ],
    );
  }

  /** Soft-archives the current client and returns to the client list. */
  async function archiveClient() {
    if (clientId == null || mutationPending.current) return;
    mutationPending.current = true;
    setIsArchiving(true);
    const timestamp = new Date().toISOString();
    try {
      const rows = await db
        .update(clients)
        .set({ deletedAt: timestamp, updatedAt: timestamp })
        .where(and(eq(clients.id, clientId), isNull(clients.deletedAt)))
        .returning();
      const parsed = clientsSchema.safeParse(rows[0]);
      if (!parsed.success || parsed.data.deletedAt !== timestamp) {
        throw new Error("Client archive returned no valid record");
      }
      leavingAllowed.current = true;
      showSuccessToast("Client archived", "The record remains stored locally.");
      router.dismissTo("/(app)/(tabs)/clients");
    } catch {
      showErrorToast(
        "Couldn't archive client",
        "The client and your unsaved entries are still here. Please try again.",
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
          headerLeft: () => (
            <Pressable
              accessibilityLabel="Back"
              accessibilityRole="button"
              accessibilityState={{ disabled: isMutationPending }}
              disabled={isMutationPending}
              hitSlop={8}
              onPress={requestLeave}
            >
              <ArrowBigLeft color={theme.primary} size={28} />
            </Pressable>
          ),
          title: "Edit client",
        }}
      />
      {loadState.status === "loading" && (
        <StateView message="Loading client…">
          <ActivityIndicator color={theme.primary} />
        </StateView>
      )}
      {loadState.status === "invalid" && (
        <StateView
          action={() => router.replace("/(app)/(tabs)/clients")}
          actionLabel="Back to clients"
          message="This client link does not contain a valid record number."
          title="Invalid client"
        />
      )}
      {loadState.status === "missing" && (
        <StateView
          action={() => router.replace("/(app)/(tabs)/clients")}
          actionLabel="Back to clients"
          message="This client may have been archived."
          title="Client not found"
        />
      )}
      {loadState.status === "error" && (
        <StateView
          action={() => void loadClient()}
          actionLabel="Retry"
          message="Check the database and try again."
          title="Couldn’t load client"
        />
      )}
      {loadState.status === "loaded" && (
        <ClientForm
          errors={errors}
          isArchiving={isArchiving}
          isSubmitting={isSubmitting}
          mode="edit"
          onArchive={requestArchive}
          onCancel={requestLeave}
          onChange={changeValue}
          onSubmit={submit}
          presentation="screen"
          values={values}
        />
      )}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: { flex: 1, backgroundColor: theme.background },
}));
