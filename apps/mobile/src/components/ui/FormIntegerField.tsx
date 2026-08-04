import { useEffect, useState } from "react";

import {
  FormTextField,
  type FormTextFieldProps,
} from "@/components/ui/FormTextField";

export type FormIntegerFieldProps = Omit<
  FormTextFieldProps,
  "keyboardType" | "multiline" | "onChangeText" | "value"
> & {
  value?: number;
  onChange: (value: number | undefined) => void;
};

/** Exposes an integer value while retaining the transient text required by React Native's text input. */
export function FormIntegerField({
  value,
  onChange,
  ...textFieldProps
}: FormIntegerFieldProps) {
  const [inputValue, setInputValue] = useState(
    value === undefined ? "" : String(value),
  );

  useEffect(() => {
    setInputValue(value === undefined ? "" : String(value));
  }, [value]);

  function handleChangeText(nextValue: string) {
    if (nextValue === "") {
      setInputValue(nextValue);
      onChange(undefined);
      return;
    }

    if (nextValue === "-") {
      setInputValue(nextValue);
      return;
    }

    if (!/^-?\d+$/.test(nextValue)) return;

    const integer = Number(nextValue);
    if (!Number.isSafeInteger(integer)) return;

    setInputValue(nextValue);
    onChange(integer);
  }

  return (
    <FormTextField
      {...textFieldProps}
      keyboardType="number-pad"
      onChangeText={handleChangeText}
      value={inputValue}
    />
  );
}
