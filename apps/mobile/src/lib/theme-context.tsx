import { createContext, useContext, useState } from "react";
import { useColorScheme } from "react-native";
import { themes } from "@/lib/themes";
import type { ColorTheme, Theme } from "@/lib/themes";

type ThemeContextValue = {
  theme: ColorTheme;
  toggleTheme: () => void;
};

/** React context that holds the active theme and toggle function. Consume via `useTheme` or `useToggleTheme` rather than reading this directly. */
const ThemeContext = createContext<ThemeContextValue>({
  theme: themes.light,
  toggleTheme: () => {},
});

/**
 * Provides the active `ColorTheme` to the tree. Defaults to the system colour scheme, but tracks a user override
 * in local state so the theme can be toggled independently of the OS setting via `useToggleTheme`.
 *
 * TODO: Persist the override to an app settings table in the database so it survives app restarts.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState<Theme | null>(null);
  const scheme: Theme =
    override ?? (systemScheme === "dark" ? "dark" : "light");

  function toggleTheme() {
    setOverride((prev) => {
      const current = prev ?? (systemScheme === "dark" ? "dark" : "light");
      return current === "dark" ? "light" : "dark";
    });
  }

  return (
    <ThemeContext.Provider value={{ theme: themes[scheme], toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Returns the active `ColorTheme` object. Re-renders the component whenever the theme changes. Must be used inside `ThemeProvider`.
 *
 * @example
 * function MyComponent() {
 *   const theme = useTheme();
 *   return <View style={{ backgroundColor: theme.background }} />;
 * }
 */
export const useTheme = () => useContext(ThemeContext).theme;

/**
 * Returns a function that toggles the theme between light and dark, overriding the system setting. Must be used inside `ThemeProvider`.
 *
 * @example
 * function ToggleButton() {
 *   const toggleTheme = useToggleTheme();
 *   return <Button title="Toggle theme" onPress={toggleTheme} />;
 * }
 */
export const useToggleTheme = () => useContext(ThemeContext).toggleTheme;
