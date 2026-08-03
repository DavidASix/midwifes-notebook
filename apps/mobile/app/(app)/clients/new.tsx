import { useMemo, useState } from "react";

import { ClientForm } from "@/components/ClientForm";
import { SlideUpScreen } from "@/components/ui/SlideUpScreen";
import { getDb } from "@/db";
import { clients } from "@/db/schema";
import { useSlideUpScreen } from "@/hooks/useSlideUpScreen";
import {
  buildClientInsert,
  initialClientFormValues,
  type ClientFormErrors,
  type ClientFormValues,
} from "@/lib/client-form";
import { showErrorToast } from "@/lib/toast";

export default function NewClientScreen() {
  const db = getDb();
  const [values, setValues] = useState<ClientFormValues>(
    initialClientFormValues,
  );
  const [errors, setErrors] = useState<ClientFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(initialClientFormValues),
    [values],
  );
  const sheet = useSlideUpScreen({
    shouldConfirmDismiss: isDirty,
    confirmation: {
      title: "Discard this client?",
      message: "Your changes have not been saved.",
    },
  });

  function changeValue<K extends keyof ClientFormValues>(
    field: K,
    value: ClientFormValues[K],
  ) {
    const nextValue = value === "" ? undefined : value;
    setValues((current) => ({ ...current, [field]: nextValue }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submit() {
    if (isSubmitting) return;
    const result = buildClientInsert(values);
    if (!result.success) {
      setErrors(result.errors);
      showErrorToast(
        "Review highlighted fields",
        "Correct the highlighted fields and try again.",
      );
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    try {
      await db.insert(clients).values(result.data);
      sheet.dismiss();
    } catch {
      showErrorToast(
        "Couldn't add client",
        "Your entries are still here. Please try again.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <SlideUpScreen controller={sheet}>
      <ClientForm
        errors={errors}
        isSubmitting={isSubmitting}
        onCancel={sheet.requestDismiss}
        onChange={changeValue}
        onSubmit={submit}
        values={values}
      />
    </SlideUpScreen>
  );
}
