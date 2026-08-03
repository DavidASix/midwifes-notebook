# Bottom Sheets

Slide-up screens in the mobile app use `@gorhom/bottom-sheet` inside an Expo Router route. The route owns navigation
and screen lifetime; Gorhom owns the visible sheet, backdrop, drag gesture, snap points, and sheet-aware scrolling.
`SlideUpScreen` provides the shared presentation and `useSlideUpScreen` coordinates dismissal. The add-client route in
`apps/mobile/app/(app)/clients/new.tsx` is the reference consumer.

## When to use one

Use a bottom sheet for a partial-height, draggable screen that should leave the previous screen visible behind it. Use a
normal stack screen for ordinary drill-down navigation. A full-screen modal that does not need snapping or sheet-aware
scrolling can use Expo Router's native modal presentation instead.

## App-level setup

`@gorhom/bottom-sheet` depends on React Native Gesture Handler, Reanimated, and Worklets. The root rendered by
`apps/mobile/app/_layout.tsx` is therefore wrapped in a full-height `GestureHandlerRootView`. Keep this wrapper above the
theme, lock, and navigation providers so sheets in any route can receive gestures.

## Shared route surface

A sheet screen is still a real Expo Router route. Wrap its content in `SlideUpScreen`, which configures the route as a
transparent modal and renders the themed Gorhom sheet, handle, and backdrop:

```tsx
const sheet = useSlideUpScreen();

return <SlideUpScreen controller={sheet}>{content}</SlideUpScreen>;
```

The component disables the stack's native dismissal gesture. Otherwise the navigator and the bottom sheet can both try
to dismiss the screen, bypassing sheet animations or unsaved-change guards.

The shared default is a single `"93%"` snap point with dynamic sizing disabled. The sheet surface is inset 8 points from
each horizontal edge so the originating screen remains visible around it. `SlideUpScreen` also passes the device's safe
area to Gorhom as its bottom inset, keeping sheet content above system navigation controls. Pass `snapPoints` or
`enableDynamicSizing` when a screen needs different sizing. Pull-down and backdrop press close the sheet by default.

Keep `SlideUpScreen` in the route component. Reusable feature content, such as `ClientForm`, belongs inside it and should
not create the modal or manipulate router history itself.

## Closing and navigation

`useSlideUpScreen` makes the sheet closing animation the only normal exit path:

1. Cancel, backdrop press, pull-down, navigation, or a successful save requests that the sheet close.
2. The controller closes the Gorhom sheet after any required confirmation.
3. Gorhom finishes the animation and invokes `onClose`.
4. The controller removes the transparent-modal route, replaying the original navigation action when there was one.

Do not call `router.back()` at the same time as `close()`. Popping the route early unmounts the sheet before its closing
animation completes.

### Protecting unsaved changes

Forms opt into the guard by supplying current dirty state and feature-specific confirmation copy:

```tsx
const sheet = useSlideUpScreen({
  shouldConfirmDismiss: isDirty,
  confirmation: {
    title: "Discard this client?",
    message: "Your changes have not been saved.",
  },
});
```

Use `sheet.requestDismiss` for Cancel and any other action that must respect the guard. Use `sheet.dismiss()` only after
an operation, such as a successful save, has made dismissal safe.

The controller guards Gorhom gestures and Expo Router's `beforeRemove` event. For a dirty pull-down or backdrop close,
it restores the sheet to index `0` before showing the confirmation. For Android back or another navigation action, it
stores the original action, closes the sheet after confirmation, and dispatches that action after the animation. Internal
refs prevent overlapping alerts and ensure the route pop caused by an approved close is not intercepted a second time.

## Scrollable content and fixed actions

Use Gorhom's scrollable primitives inside a sheet. For a form with text inputs, use the shared
`BottomSheetKeyboardAwareScrollView`. It combines `react-native-keyboard-controller`'s automatic focused-input
scrolling with Gorhom's scrollable registration, preserving the sheet's pan gesture. Set
`keyboardDismissMode="on-drag"` and `keyboardShouldPersistTaps="handled"` for the current form behaviour.

Text fields remain standard React Native `TextInput` controls. `SlideUpScreen` uses Gorhom's `interactive` keyboard
behaviour with `android_keyboardInputMode="adjustPan"` and Android's matching `softwareKeyboardLayoutMode="pan"`
setting. `BottomSheetKeyboardAwareScrollView` tracks the focused input and scrolls it above the keyboard without
feature-specific focus handlers or keyboard-height calculations. The `restore` blur behaviour returns the sheet to its
prior position after the keyboard closes.

Place persistent actions, such as Cancel and Save, as a sibling after the scroll view. This keeps the footer fixed while
the form body scrolls. The route still owns submission and cancellation; the form reports intent through callbacks.

## Testing

Use the library's provided Jest mock, but extend its default component so imperative `close()` calls invoke `onClose`.
This preserves the production contract that closing the sheet eventually pops the route:

```tsx
jest.mock("@gorhom/bottom-sheet", () => {
  const bottomSheetMock = jest.requireActual("@gorhom/bottom-sheet/mock");

  class MockBottomSheet extends bottomSheetMock.default {
    close() {
      this.props.onClose?.();
    }
  }

  return { __esModule: true, ...bottomSheetMock, default: MockBottomSheet };
});
```

Tests rendering a keyboard-aware sheet also use `react-native-keyboard-controller/jest`. Mock
`react-native-reanimated`'s `createAnimatedComponent` as an identity wrapper so Gorhom can register the test scrollable
without loading native Worklets.

The controller has focused tests in `src/hooks/__tests__/useSlideUpScreen.test.ts`. They protect the ordering contract,
duplicate-confirmation guard, pull-down restoration, and guarded and unguarded navigation paths. Feature tests should
still verify that persistence succeeds before `dismiss()` and that their dirty-state input and confirmation copy are
correct. Gesture animation details remain the library's responsibility; test app decisions at the callback boundaries.
