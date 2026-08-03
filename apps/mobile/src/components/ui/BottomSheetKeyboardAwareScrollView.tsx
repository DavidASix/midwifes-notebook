import { memo, type FunctionComponent } from "react";
import {
  createBottomSheetScrollableComponent,
  SCROLLABLE_TYPE,
  type BottomSheetScrollableProps,
  type BottomSheetScrollViewMethods,
} from "@gorhom/bottom-sheet";
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewProps,
} from "react-native-keyboard-controller";
import Reanimated from "react-native-reanimated";

type BottomSheetKeyboardAwareScrollViewProps = KeyboardAwareScrollViewProps &
  BottomSheetScrollableProps;

const AnimatedKeyboardAwareScrollView = Reanimated.createAnimatedComponent(
  KeyboardAwareScrollView as FunctionComponent<KeyboardAwareScrollViewProps>,
);

const BottomSheetScrollable = createBottomSheetScrollableComponent<
  BottomSheetScrollViewMethods,
  BottomSheetKeyboardAwareScrollViewProps
>(SCROLLABLE_TYPE.SCROLLVIEW, AnimatedKeyboardAwareScrollView);

/** Combines keyboard-aware focus scrolling with Gorhom's bottom-sheet gesture coordination. */
export const BottomSheetKeyboardAwareScrollView = memo(BottomSheetScrollable);

BottomSheetKeyboardAwareScrollView.displayName =
  "BottomSheetKeyboardAwareScrollView";
