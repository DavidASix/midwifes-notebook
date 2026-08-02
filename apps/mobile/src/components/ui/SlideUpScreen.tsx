import { useCallback, type ReactNode } from "react";
import { View } from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  type BottomSheetProps,
} from "@gorhom/bottom-sheet";
import { Stack } from "expo-router";

import type { SlideUpScreenController } from "@/hooks/useSlideUpScreen";
import { makeStyles } from "@/lib/make-styles";

const defaultSnapPoints = ["93%"];

type SlideUpScreenProps = {
  children: ReactNode;
  controller: SlideUpScreenController;
  enableDynamicSizing?: boolean;
  snapPoints?: BottomSheetProps["snapPoints"];
};

/** Provides the shared Expo Router presentation and themed Gorhom surface for a route-backed slide-up screen. */
export function SlideUpScreen({
  children,
  controller,
  enableDynamicSizing = false,
  snapPoints = defaultSnapPoints,
}: SlideUpScreenProps) {
  const styles = useStyles();
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
          enableDynamicSizing={enableDynamicSizing}
          enablePanDownToClose
          handleIndicatorStyle={styles.handleIndicator}
          index={0}
          onAnimate={controller.onAnimate}
          onClose={controller.onClose}
          ref={controller.sheetRef}
          snapPoints={snapPoints}
        >
          {children}
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
