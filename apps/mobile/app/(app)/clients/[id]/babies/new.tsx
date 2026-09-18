import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, View } from "react-native";
import { and, eq, isNull } from "drizzle-orm";
import {
  router,
  Stack,
  useLocalSearchParams,
  useNavigation,
} from "expo-router";

import { BabyForm } from "@/components/BabyForm";
import { StateView } from "@/components/ui/StateView";
import { getDb } from "@/db";
import { babies, babiesSchema, clients, clientsSchema } from "@/db/schema";
import {
  buildBabyInsert,
  initialBabyFormValues,
  type BabyFormErrors,
  type BabyFormValues,
} from "@/lib/baby-form";
import { makeStyles } from "@/lib/make-styles";
import { markBabyRecordsChanged } from "@/lib/baby-record";
import { parsePositiveIntegerRouteParam } from "@/lib/route-params";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

/** Creates a baby record for one active client while protecting form content. */
export default function NewBabyScreen() {
  // Hooks
  const db = getDb();
  const styles = useStyles();
  const navigation = useNavigation();

  // URL state
  const { id: routeId } = useLocalSearchParams<{ id?: string | string[] }>();
  const clientId = parsePositiveIntegerRouteParam(routeId);

  // Refs for lifecycle management
  const leavingAllowed = useRef(false);
  const confirmationOpen = useRef(false);
  const mutationPending = useRef(false);
  const pendingNavigationAction =
    useRef<Parameters<typeof navigation.dispatch>[0]>(null);

  // Component state
  const [values, setValues] = useState<BabyFormValues>(initialBabyFormValues);
  const [errors, setErrors] = useState<BabyFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived state
  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(initialBabyFormValues),
    [values],
  );

  /** Confirms draft loss once and resumes the original navigation action when approved. */
  const confirmDiscard = useCallback(() => {
    if (confirmationOpen.current) return;
    confirmationOpen.current = true;
    const closeConfirmation = () => {
      confirmationOpen.current = false;
      pendingNavigationAction.current = null;
    };
    Alert.alert(
      "Discard this baby record?",
      "Your changes have not been saved.",
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
    if (clientId == null || mutationPending.current) return;
    const result = buildBabyInsert(clientId, values);
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
      const clientRows = await db
        .select()
        .from(clients)
        .where(and(eq(clients.id, clientId), isNull(clients.deletedAt)))
        .limit(1);
      if (!clientsSchema.safeParse(clientRows[0]).success) {
        throw new Error("Client is unavailable");
      }
      const rows = await db.insert(babies).values(result.data).returning();
      if (!babiesSchema.safeParse(rows[0]).success) {
        throw new Error("Baby insert returned no valid record");
      }
      leavingAllowed.current = true;
      markBabyRecordsChanged(clientId);
      showSuccessToast("Baby record added", "The record was saved.");
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

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          gestureEnabled: !isDirty && !isSubmitting,
          title: "New baby record",
        }}
      />
      {clientId == null ? (
        <StateView
          action={() => router.back()}
          actionLabel="Go back"
          message="This link does not contain a valid client record number."
          title="Invalid client"
        />
      ) : (
        <BabyForm
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
  container: { flex: 1, backgroundColor: theme.background },
}));
