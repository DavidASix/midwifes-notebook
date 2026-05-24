import { render } from "@testing-library/react-native";
import React from "react";
import { ThemeProvider } from "./lib/theme-context";

export function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

export * from "@testing-library/react-native";
