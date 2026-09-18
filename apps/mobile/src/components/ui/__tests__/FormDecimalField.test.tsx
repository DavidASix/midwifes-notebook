import React, { useState } from "react";

import { FormDecimalField } from "@/components/ui/FormDecimalField";
import { Text } from "@/components/ui/Text";
import { fireEvent, renderWithTheme, screen } from "@/test-utils";

function DecimalFieldHarness({ initialValue }: { initialValue?: number }) {
  const [value, setValue] = useState(initialValue);
  return (
    <>
      <FormDecimalField
        label="Ounces"
        maximumExclusive={16}
        onChange={setValue}
        value={value}
      />
      <Text testID="managed-value">
        {value === undefined ? "unset" : String(value)}
      </Text>
    </>
  );
}

describe("FormDecimalField", () => {
  it("updates the stored value after deleting fractional digits while retaining the decimal point", () => {
    renderWithTheme(<DecimalFieldHarness initialValue={7.5} />);
    fireEvent.changeText(screen.getByLabelText("Ounces"), "7.");

    expect(screen.getByTestId("managed-value").props.children).toBe("7");
    expect(screen.getByLabelText("Ounces").props.value).toBe("7.");

    fireEvent.changeText(screen.getByLabelText("Ounces"), "7.2");
    expect(screen.getByTestId("managed-value").props.children).toBe("7.2");
  });

  it("accepts a non-negative decimal and maps an empty field to unset", () => {
    renderWithTheme(<DecimalFieldHarness />);
    fireEvent.changeText(screen.getByLabelText("Ounces"), "7.5");
    expect(screen.getByTestId("managed-value").props.children).toBe("7.5");

    fireEvent.changeText(screen.getByLabelText("Ounces"), "");
    expect(screen.getByTestId("managed-value").props.children).toBe("unset");
  });

  it("accepts a decimal entered without a leading zero", () => {
    renderWithTheme(<DecimalFieldHarness />);
    fireEvent.changeText(screen.getByLabelText("Ounces"), ".");

    expect(screen.getByTestId("managed-value").props.children).toBe("unset");
    expect(screen.getByLabelText("Ounces").props.value).toBe(".");

    fireEvent.changeText(screen.getByLabelText("Ounces"), ".5");
    expect(screen.getByTestId("managed-value").props.children).toBe("0.5");
    expect(screen.getByLabelText("Ounces").props.value).toBe(".5");
  });

  it("rejects negative, malformed, and 16-ounce values", () => {
    renderWithTheme(<DecimalFieldHarness initialValue={7.5} />);
    fireEvent.changeText(screen.getByLabelText("Ounces"), "-1");
    fireEvent.changeText(screen.getByLabelText("Ounces"), "7.5.2");
    fireEvent.changeText(screen.getByLabelText("Ounces"), "16");

    expect(screen.getByLabelText("Ounces").props.value).toBe("7.5");
    expect(screen.getByTestId("managed-value").props.children).toBe("7.5");
  });
});
