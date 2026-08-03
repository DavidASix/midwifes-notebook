import { useCallback, useEffect, useRef } from "react";
import { Alert } from "react-native";
import BottomSheet, { type BottomSheetProps } from "@gorhom/bottom-sheet";
import { router, useNavigation } from "expo-router";

type DismissConfirmation = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type UseSlideUpScreenOptions =
  | {
      shouldConfirmDismiss: boolean;
      confirmation: DismissConfirmation;
    }
  | {
      shouldConfirmDismiss?: false;
      confirmation?: never;
    };

export type SlideUpScreenController = {
  sheetRef: React.RefObject<BottomSheet | null>;
  dismiss: () => void;
  requestDismiss: () => void;
  onAnimate: NonNullable<BottomSheetProps["onAnimate"]>;
  onClose: NonNullable<BottomSheetProps["onClose"]>;
};

/**
 * Coordinates a route-backed bottom sheet so gestures, explicit controls, and navigation all use the same animated
 * dismissal path. An optional confirmation prevents dirty forms from being removed before dismissal is approved.
 */
export function useSlideUpScreen(
  options: UseSlideUpScreenOptions = {},
): SlideUpScreenController {
  const navigation = useNavigation();
  const sheetRef = useRef<BottomSheet>(null);
  const dismissalAllowedRef = useRef(false);
  const confirmationOpenRef = useRef(false);
  const pendingNavigationActionRef =
    useRef<Parameters<typeof navigation.dispatch>[0]>(null);
  const shouldConfirmDismiss = options.shouldConfirmDismiss ?? false;

  const dismiss = useCallback(() => {
    dismissalAllowedRef.current = true;
    sheetRef.current?.close();
  }, []);

  const requestDismiss = useCallback(() => {
    const confirmation = options.confirmation;
    if (!shouldConfirmDismiss || !confirmation) {
      dismiss();
      return;
    }

    if (confirmationOpenRef.current) return;
    confirmationOpenRef.current = true;

    const cancel = () => {
      confirmationOpenRef.current = false;
      pendingNavigationActionRef.current = null;
    };
    Alert.alert(
      confirmation.title,
      confirmation.message,
      [
        {
          text: confirmation.cancelLabel ?? "Keep editing",
          style: "cancel",
          onPress: cancel,
        },
        {
          text: confirmation.confirmLabel ?? "Discard",
          style: "destructive",
          onPress: () => {
            confirmationOpenRef.current = false;
            dismiss();
          },
        },
      ],
      { cancelable: true, onDismiss: cancel },
    );
  }, [dismiss, options.confirmation, shouldConfirmDismiss]);

  const onAnimate = useCallback<NonNullable<BottomSheetProps["onAnimate"]>>(
    (_fromIndex, toIndex) => {
      if (
        toIndex !== -1 ||
        dismissalAllowedRef.current ||
        !shouldConfirmDismiss
      ) {
        return;
      }

      sheetRef.current?.snapToIndex(0);
      requestDismiss();
    },
    [requestDismiss, shouldConfirmDismiss],
  );

  const onClose = useCallback(() => {
    dismissalAllowedRef.current = true;
    const pendingAction = pendingNavigationActionRef.current;
    pendingNavigationActionRef.current = null;

    if (pendingAction) {
      navigation.dispatch(pendingAction);
      return;
    }

    router.back();
  }, [navigation]);

  useEffect(
    () =>
      navigation.addListener("beforeRemove", (event) => {
        if (dismissalAllowedRef.current) return;

        event.preventDefault();
        pendingNavigationActionRef.current = event.data.action;
        requestDismiss();
      }),
    [navigation, requestDismiss],
  );

  return { sheetRef, dismiss, requestDismiss, onAnimate, onClose };
}
