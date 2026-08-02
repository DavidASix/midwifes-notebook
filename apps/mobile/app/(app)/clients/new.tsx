import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, View } from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
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
import { makeStyles } from "@/lib/make-styles";
import { showErrorToast } from "@/lib/toast";

export default function NewClientScreen() {
  const styles = useStyles();
  const db = getDb();
  const navigation = useNavigation();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const savedRef = useRef(false);
  const allowDismissRef = useRef(false);
  const discardPromptOpenRef = useRef(false);
  const [values, setValues] = useState<ClientFormValues>(
    initialClientFormValues,
  );
  const [errors, setErrors] = useState<ClientFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(initialClientFormValues),
    [values],
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  const confirmDiscard = useCallback((onDiscard: () => void) => {
    if (discardPromptOpenRef.current) return;
    discardPromptOpenRef.current = true;

    const closePrompt = () => {
      discardPromptOpenRef.current = false;
    };

    Alert.alert(
      "Discard this client?",
      "Your changes have not been saved.",
      [
        { text: "Keep editing", style: "cancel", onPress: closePrompt },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            closePrompt();
            onDiscard();
          },
        },
      ],
      { cancelable: true, onDismiss: closePrompt },
    );
  }, []);

  const closeSheet = useCallback(() => {
    allowDismissRef.current = true;
    bottomSheetRef.current?.close();
  }, []);

  const requestClose = useCallback(() => {
    if (isDirty && !savedRef.current) {
      confirmDiscard(closeSheet);
      return;
    }

    closeSheet();
  }, [closeSheet, confirmDiscard, isDirty]);

  const handleSheetAnimate = useCallback(
    (_fromIndex: number, toIndex: number) => {
      if (
        toIndex !== -1 ||
        allowDismissRef.current ||
        savedRef.current ||
        !isDirty
      ) {
        return;
      }

      bottomSheetRef.current?.snapToIndex(0);
      confirmDiscard(closeSheet);
    },
    [closeSheet, confirmDiscard, isDirty],
  );

  useEffect(
    () =>
      navigation.addListener("beforeRemove", (event) => {
        if (!isDirty || savedRef.current) return;
        event.preventDefault();
        confirmDiscard(() => {
          allowDismissRef.current = true;
          navigation.dispatch(event.data.action);
        });
      }),
    [confirmDiscard, isDirty, navigation],
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
        "Correct the highlighted fields and try again.",
      );
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    try {
      await db.insert(clients).values(result.data);
      savedRef.current = true;
      closeSheet();
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
          animation: "fade",
          contentStyle: { backgroundColor: "transparent" },
          gestureEnabled: false,
          headerShown: false,
          presentation: "transparentModal",
        }}
      />
      <View style={styles.container}>
        <BottomSheet
          backdropComponent={renderBackdrop}
          backgroundStyle={styles.sheetSurface}
          enableDynamicSizing={false}
          enablePanDownToClose
          handleIndicatorStyle={styles.handleIndicator}
          index={0}
          onAnimate={handleSheetAnimate}
          onClose={() => router.back()}
          ref={bottomSheetRef}
          snapPoints={["93%"]}
        >
          <ClientForm
            errors={errors}
            isSubmitting={isSubmitting}
            onCancel={requestClose}
            onChange={changeValue}
            onSubmit={submit}
            values={values}
          />
        </BottomSheet>
      </View>
    </>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    flex: 1,
  },
  sheetSurface: {
    backgroundColor: theme.background,
  },
  handleIndicator: {
    backgroundColor: theme.mutedForeground,
  },
}));
