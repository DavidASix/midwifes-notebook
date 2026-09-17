import { useEffect, useState } from "react";

import {
  FormTextField,
  type FormTextFieldProps,
} from "@/components/ui/FormTextField";

export type FormDecimalFieldProps = Omit<
  FormTextFieldProps,
  "keyboardType" | "multiline" | "onChangeText" | "value"
> & {
  value?: number;
  onChange: (value: number | undefined) => void;
  maximumExclusive?: number;
};

/** Exposes a non-negative decimal while retaining transient input text. */
export function FormDecimalField({
  value,
  onChange,
  maximumExclusive,
  ...textFieldProps
}: FormDecimalFieldProps) {
  const [inputValue, setInputValue] = useState(
    value === undefined ? "" : String(value),
  );

  useEffect(() => {
    setInputValue(value === undefined ? "" : String(value));
  }, [value]);

  function handleChangeText(nextValue: string) {
    if (nextValue === "") {
      setInputValue("");
      onChange(undefined);
      return;
    }
    if (!/^\d*(?:\.\d*)?$/.test(nextValue)) return;
    const parsed = Number(nextValue);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    if (maximumExclusive !== undefined && parsed >= maximumExclusive) return;
    setInputValue(nextValue);
    if (!nextValue.endsWith(".")) onChange(parsed);
  }

  return (
    <FormTextField
      {...textFieldProps}
      keyboardType="decimal-pad"
      onChangeText={handleChangeText}
      value={inputValue}
    />
  );
}
