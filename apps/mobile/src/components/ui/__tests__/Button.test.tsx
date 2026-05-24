import React from "react";
import { fireEvent, renderWithTheme, screen } from "../../../test-utils";
import { Button } from "../Button";

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
});
