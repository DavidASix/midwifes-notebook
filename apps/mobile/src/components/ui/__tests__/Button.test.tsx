import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, renderWithTheme, screen } from "@/test-utils";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { themes } from "@/lib/themes";

describe("Button", () => {
  it("renders the title", () => {
    renderWithTheme(<Button title="Save" />);
    expect(screen.getByText("Save")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    renderWithTheme(<Button title="Save" onPress={onPress} />);
    fireEvent.press(screen.getByText("Save"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not call onPress when disabled", () => {
    const onPress = jest.fn();
    renderWithTheme(<Button title="Save" onPress={onPress} disabled />);
    fireEvent.press(screen.getByText("Save"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("renders secondary variant without crashing", () => {
    renderWithTheme(<Button title="Cancel" variant="secondary" />);
    expect(screen.getByText("Cancel")).toBeTruthy();
  });

  it("uses the destructive theme color for destructive actions", () => {
    renderWithTheme(<Button title="Archive" variant="destructive" />);
    const style = StyleSheet.flatten(screen.getByRole("button").props.style);
    expect(style.backgroundColor).toBe(themes.light.destructive);
  });

  it("renders an icon beside its title", () => {
    renderWithTheme(
      <Button icon={<Text testID="save-icon">icon</Text>} title="Save" />,
    );
    expect(screen.getByTestId("save-icon")).toBeTruthy();
    expect(screen.getByText("Save")).toBeTruthy();
  });
});
