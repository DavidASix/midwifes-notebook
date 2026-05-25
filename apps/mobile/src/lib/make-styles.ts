import { useMemo } from "react";
import { ImageStyle, StyleSheet, TextStyle, ViewStyle } from "react-native";
import { useTheme } from "@/lib/theme-context";
import type { ColorTheme } from "@/lib/themes";

type NamedStyles = Record<string, ViewStyle | TextStyle | ImageStyle>;

/**
 * Defines a themed stylesheet. Call at module level with a factory that receives the current `ColorTheme` and returns
 * a style object. Returns a `useStyles` hook that resolves the theme from context and memoises the result — styles
 * only recompute when the theme changes.
 *
 * @example
 * const useStyles = makeStyles((theme) => ({
 *   container: { backgroundColor: theme.background },
 *   label: { color: theme.foreground },
 * }));
 *
 * function MyComponent() {
 *   const styles = useStyles();
 *   return <View style={styles.container} />;
 * }
 */
export function makeStyles<T extends NamedStyles>(
  factory: (theme: ColorTheme) => T,
) {
  return function useStyles(): T {
    const theme = useTheme();
    return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
  };
}
