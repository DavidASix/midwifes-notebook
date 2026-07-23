import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, View } from "react-native";
import { router, Stack, useNavigation } from "expo-router";

import { ClientForm } from "@/components/ClientForm";
import { SheetHandle } from "@/components/ui/SheetHandle";
import { getDb } from "@/db";
import { clients } from "@/db/schema";
import {
  buildClientInsert,
  initialClientFormValues,
  type ClientFormErrors,
  type ClientFormValues,
} from "@/lib/client-form";
import { makeStyles } from "@/lib/make-styles";
import { showErrorToast } from "@/lib/toast";

export default function NewClientScreen() {
  const styles = useStyles();
  const db = getDb();
  const navigation = useNavigation();
  const savedRef = useRef(false);
  const [values, setValues] = useState<ClientFormValues>(
    initialClientFormValues,
  );
  const [errors, setErrors] = useState<ClientFormErrors>({});
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
  }

  async function submit() {
    if (isSubmitting) return;
    const result = buildClientInsert(values);
    if (!result.success) {
      setErrors(result.errors);
      showErrorToast(
        "Review highlighted fields",
        "First and last name are required.",
      );
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    try {
      await db.insert(clients).values(result.data);
      savedRef.current = true;
      router.back();
    } catch {
      showErrorToast(
        "Couldn't add client",
        "Your entries are still here. Please try again.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          gestureEnabled: !isDirty,
          headerShown: false,
          presentation: "formSheet",
          sheetAllowedDetents: [0.93],
          sheetCornerRadius: 24,
          sheetElevation: 16,
          sheetInitialDetentIndex: 0,
          sheetShouldOverflowTopInset: false,
        }}
      />
      <View style={styles.sheetSurface}>
        <SheetHandle />
        <ClientForm
          errors={errors}
          isSubmitting={isSubmitting}
          onCancel={() => router.back()}
          onChange={changeValue}
          onSubmit={submit}
          values={values}
        />
      </View>
    </>
  );
}

const useStyles = makeStyles((theme) => ({
  sheetSurface: {
    flex: 1,
    backgroundColor: theme.background,
  },
}));
