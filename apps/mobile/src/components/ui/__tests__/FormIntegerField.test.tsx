import React, { useState } from "react";

import { FormIntegerField } from "@/components/ui/FormIntegerField";
import { Text } from "@/components/ui/Text";
import { fireEvent, renderWithTheme, screen } from "@/test-utils";

function IntegerFieldHarness({ initialValue }: { initialValue?: number }) {
  const [value, setValue] = useState(initialValue);

  return (
    <>
      <FormIntegerField label="Count" onChange={setValue} value={value} />
      <Text testID="managed-value">
        {value === undefined ? "unset" : String(value)}
      </Text>
    </>
  );
}

describe("FormIntegerField", () => {
  it("renders and updates an integer value", () => {
    renderWithTheme(<IntegerFieldHarness initialValue={12} />);

    expect(screen.getByLabelText("Count").props.value).toBe("12");
    fireEvent.changeText(screen.getByLabelText("Count"), "24");

    expect(screen.getByTestId("managed-value").props.children).toBe("24");
  });

  it("maps an empty field to an unset value", () => {
    renderWithTheme(<IntegerFieldHarness initialValue={12} />);

    fireEvent.changeText(screen.getByLabelText("Count"), "");

    expect(screen.getByLabelText("Count").props.value).toBe("");
    expect(screen.getByTestId("managed-value").props.children).toBe("unset");
  });

  it("unsets a stale negative value while retaining a minus for continued entry", () => {
    renderWithTheme(<IntegerFieldHarness initialValue={-3} />);

    fireEvent.changeText(screen.getByLabelText("Count"), "-");
    expect(screen.getByLabelText("Count").props.value).toBe("-");
    expect(screen.getByTestId("managed-value").props.children).toBe("unset");

    fireEvent.changeText(screen.getByLabelText("Count"), "-4");
    expect(screen.getByTestId("managed-value").props.children).toBe("-4");
  });

  it("ignores values that are not safe integers", () => {
    renderWithTheme(<IntegerFieldHarness initialValue={12} />);

    fireEvent.changeText(screen.getByLabelText("Count"), "12.5");
    fireEvent.changeText(
      screen.getByLabelText("Count"),
      String(Number.MAX_SAFE_INTEGER + 1),
    );

    expect(screen.getByLabelText("Count").props.value).toBe("12");
    expect(screen.getByTestId("managed-value").props.children).toBe("12");
  });
});
