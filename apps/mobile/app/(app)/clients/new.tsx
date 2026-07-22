import { useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
import { router, Stack, useNavigation } from "expo-router";

import { ClientForm } from "@/components/ClientForm";
import { getDb } from "@/db";
import { clients } from "@/db/schema";
import {
  buildClientInsert,
  initialClientFormValues,
  type ClientFormErrors,
  type ClientFormValues,
} from "@/lib/client-form";

export default function NewClientScreen() {
  const db = getDb();
  const navigation = useNavigation();
  const savedRef = useRef(false);
  const [values, setValues] = useState<ClientFormValues>(
    initialClientFormValues,
  );
  const [errors, setErrors] = useState<ClientFormErrors>({});
  const [submitError, setSubmitError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(initialClientFormValues),
    [values],
  );

  useEffect(
    () =>
      navigation.addListener("beforeRemove", (event) => {
        if (!isDirty || savedRef.current) return;
        event.preventDefault();
        Alert.alert(
          "Discard this client?",
          "Your changes have not been saved.",
          [
            { text: "Keep editing", style: "cancel" },
            {
              text: "Discard",
              style: "destructive",
              onPress: () => navigation.dispatch(event.data.action),
            },
          ],
        );
      }),
    [isDirty, navigation],
  );

  function changeValue<K extends keyof ClientFormValues>(
    field: K,
    value: ClientFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError(undefined);
  }

  async function submit() {
    if (isSubmitting) return;
    const result = buildClientInsert(values);
    if (!result.success) {
      setErrors(result.errors);
      setSubmitError(
        "Review the highlighted fields before adding this client.",
      );
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setSubmitError(undefined);
    try {
      await db.insert(clients).values(result.data);
      savedRef.current = true;
      router.back();
    } catch {
      setSubmitError(
        "We couldn't add this client. Your entries are still here—please try again.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Add Client",
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <ClientForm
        errors={errors}
        isSubmitting={isSubmitting}
        onCancel={() => router.back()}
        onChange={changeValue}
        onSubmit={submit}
        submitError={submitError}
        values={values}
      />
    </>
  );
}
