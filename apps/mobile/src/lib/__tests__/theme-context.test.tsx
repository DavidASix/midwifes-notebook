import { act, renderHook } from "@testing-library/react-native";
import React from "react";
import { ThemeProvider, useTheme, useToggleTheme } from "@/lib/theme-context";
import { themes } from "@/lib/themes";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe("useTheme", () => {
  it("returns light theme by default", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current).toEqual(themes.light);
  });
});

describe("useToggleTheme", () => {
  it("switches to dark on first toggle", () => {
    const { result } = renderHook(
      () => ({ theme: useTheme(), toggle: useToggleTheme() }),
      { wrapper },
    );

    act(() => result.current.toggle());

    expect(result.current.theme).toEqual(themes.dark);
  });

  it("returns to light on second toggle", () => {
    const { result } = renderHook(
      () => ({ theme: useTheme(), toggle: useToggleTheme() }),
      { wrapper },
    );

    act(() => result.current.toggle());
    act(() => result.current.toggle());

    expect(result.current.theme).toEqual(themes.light);
  });
});
