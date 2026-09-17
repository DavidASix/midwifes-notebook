import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import { and, eq, isNull } from "drizzle-orm";
import {
  router,
  Stack,
  useLocalSearchParams,
  useNavigation,
} from "expo-router";

import { BabyForm } from "@/components/BabyForm";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { getDb } from "@/db";
import { babies, babiesSchema } from "@/db/schema";
import {
  babyToFormValues,
  buildBabyUpdate,
  initialBabyFormValues,
  type BabyFormErrors,
  type BabyFormValues,
} from "@/lib/baby-form";
import { makeStyles } from "@/lib/make-styles";
import { parsePositiveIntegerRouteParam } from "@/lib/route-params";
import { useTheme } from "@/lib/theme-context";
import { fontFamilies, fontSize } from "@/lib/themes";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

type BabyLoadState =
  | { status: "loading" }
  | { status: "loaded"; baseline: BabyFormValues }
  | { status: "invalid" }
  | { status: "missing" }
  | { status: "error" };

/** Edits and archives one client-owned baby record while protecting changes. */
export default function EditBabyScreen() {
  const db = getDb();
  const styles = useStyles();
  const theme = useTheme();
  const navigation = useNavigation();
  const { id: routeId, babyId: routeBabyId } = useLocalSearchParams<{
    id?: string | string[];
    babyId?: string | string[];
  }>();
  const clientId = parsePositiveIntegerRouteParam(routeId);
  const babyId = parsePositiveIntegerRouteParam(routeBabyId);
  const leavingAllowed = useRef(false);
  const confirmationOpen = useRef(false);
  const mutationPending = useRef(false);
  const pendingNavigationAction =
    useRef<Parameters<typeof navigation.dispatch>[0]>(null);
  const [loadState, setLoadState] = useState<BabyLoadState>(() =>
    clientId == null || babyId == null
      ? { status: "invalid" }
      : { status: "loading" },
  );
  const [values, setValues] = useState<BabyFormValues>(initialBabyFormValues);
  const [errors, setErrors] = useState<BabyFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const isMutationPending = isSubmitting || isArchiving;
  const isDirty = useMemo(
    () =>
      loadState.status === "loaded" &&
      JSON.stringify(values) !== JSON.stringify(loadState.baseline),
    [loadState, values],
  );

  /** Loads and validates the client-owned record before initializing the editable baseline. */
  const loadBaby = useCallback(async () => {
    if (clientId == null || babyId == null) {
      setLoadState({ status: "invalid" });
      return;
    }
    setLoadState({ status: "loading" });
    try {
      const rows = await db
        .select()
        .from(babies)
        .where(
          and(
            eq(babies.id, babyId),
            eq(babies.clientId, clientId),
            isNull(babies.deletedAt),
          ),
        )
        .limit(1);
      if (!rows[0]) {
        setLoadState({ status: "missing" });
        return;
      }
      const parsed = babiesSchema.safeParse(rows[0]);
      if (!parsed.success) {
        setLoadState({ status: "error" });
        return;
      }
      const baseline = babyToFormValues(parsed.data);
      setValues(baseline);
      setErrors({});
      setLoadState({ status: "loaded", baseline });
    } catch {
      setLoadState({ status: "error" });
    }
  }, [babyId, clientId, db]);

  useEffect(() => {
    void loadBaby();
  }, [loadBaby]);

  /** Confirms draft loss once and resumes the original navigation action when approved. */
  const confirmDiscard = useCallback(() => {
    if (confirmationOpen.current) return;
    confirmationOpen.current = true;
    const closeConfirmation = () => {
      confirmationOpen.current = false;
      pendingNavigationAction.current = null;
    };
    Alert.alert(
      "Discard your changes?",
      "Your unsaved baby record edits will be lost.",
      [
        { text: "Keep editing", style: "cancel", onPress: closeConfirmation },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            const action = pendingNavigationAction.current;
            leavingAllowed.current = true;
            closeConfirmation();
            if (action) navigation.dispatch(action);
            else router.back();
          },
        },
      ],
      { cancelable: true, onDismiss: closeConfirmation },
    );
  }, [navigation]);

  /** Blocks departure during persistence and confirms leaving when edits are unsaved. */
  const requestLeave = useCallback(() => {
    if (mutationPending.current) return;
    if (isDirty) confirmDiscard();
    else router.back();
  }, [confirmDiscard, isDirty]);

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

  /** Updates an editable field and clears its previous validation error while mutations are idle. */
  function changeValue<K extends keyof BabyFormValues>(
    field: K,
    value: BabyFormValues[K],
  ) {
    if (mutationPending.current) return;
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  /** Validates and persists the draft, retaining entered values after a failed save. */
  async function submit() {
    if (clientId == null || babyId == null || mutationPending.current) return;
    const result = buildBabyUpdate(values);
    if (!result.success) {
      setErrors(result.errors);
      showErrorToast(
        "Check baby record",
        "Correct the highlighted details and try again.",
      );
      return;
    }
    mutationPending.current = true;
    setIsSubmitting(true);
    setErrors({});
    try {
      const rows = await db
        .update(babies)
        .set({ ...result.data, updatedAt: new Date().toISOString() })
        .where(
          and(
            eq(babies.id, babyId),
            eq(babies.clientId, clientId),
            isNull(babies.deletedAt),
          ),
        )
        .returning();
      if (!babiesSchema.safeParse(rows[0]).success) {
        throw new Error("Baby update returned no valid record");
      }
      leavingAllowed.current = true;
      showSuccessToast("Baby record updated", "Changes were saved.");
      router.back();
    } catch {
      showErrorToast(
        "Couldn’t save baby record",
        "Your entries are still here. Please try again.",
      );
      mutationPending.current = false;
      setIsSubmitting(false);
    }
  }

  /** Requests confirmation before hiding the stored baby record. */
  function requestArchive() {
    if (mutationPending.current) return;
    Alert.alert(
      "Delete this baby record?",
      "It will be hidden from the client record but remain stored locally.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete record",
          style: "destructive",
          onPress: () => void archiveBaby(),
        },
      ],
    );
  }

  /** Soft-deletes the scoped record with matching timestamps and leaves only after a valid result. */
  async function archiveBaby() {
    if (clientId == null || babyId == null || mutationPending.current) return;
    mutationPending.current = true;
    setIsArchiving(true);
    const timestamp = new Date().toISOString();
    try {
      const rows = await db
        .update(babies)
        .set({ deletedAt: timestamp, updatedAt: timestamp })
        .where(
          and(
            eq(babies.id, babyId),
            eq(babies.clientId, clientId),
            isNull(babies.deletedAt),
          ),
        )
        .returning();
      const parsed = babiesSchema.safeParse(rows[0]);
      if (!parsed.success || parsed.data.deletedAt !== timestamp) {
        throw new Error("Baby archive returned no valid record");
      }
      leavingAllowed.current = true;
      showSuccessToast(
        "Baby record deleted",
        "The record remains stored locally.",
      );
      router.back();
    } catch {
      showErrorToast(
        "Couldn’t delete baby record",
        "The record and your unsaved entries are still here. Please try again.",
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
          title: "Baby record",
        }}
      />
      {loadState.status === "loading" && (
        <StateView message="Loading baby record…">
          <ActivityIndicator color={theme.primary} />
        </StateView>
      )}
      {loadState.status === "invalid" && (
        <StateView
          action={() => router.back()}
          actionLabel="Go back"
          message="This link does not contain valid record numbers."
          title="Invalid baby record"
        />
      )}
      {loadState.status === "missing" && (
        <StateView
          action={() => router.back()}
          actionLabel="Go back"
          message="This baby record may have been deleted."
          title="Baby record not found"
        />
      )}
      {loadState.status === "error" && (
        <StateView
          action={() => void loadBaby()}
          actionLabel="Retry"
          message="Check the database and try again."
          title="Couldn’t load baby record"
        />
      )}
      {loadState.status === "loaded" && (
        <BabyForm
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

/** Displays a loading or unavailable-record state with an optional recovery action. */
function StateView({
  title,
  message,
  action,
  actionLabel,
  children,
}: {
  title?: string;
  message: string;
  action?: () => void;
  actionLabel?: string;
  children?: React.ReactNode;
}) {
  const styles = useStyles();
  return (
    <View style={styles.centeredState}>
      {children}
      {title && (
        <Text header style={styles.stateTitle}>
          {title}
        </Text>
      )}
      <Text style={styles.stateText}>{message}</Text>
      {action && actionLabel && <Button onPress={action} title={actionLabel} />}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: { flex: 1, backgroundColor: theme.background },
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
