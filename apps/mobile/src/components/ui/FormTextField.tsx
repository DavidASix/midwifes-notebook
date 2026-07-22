import { TextInput, View, type KeyboardTypeOptions } from "react-native";

import { makeStyles } from "@/lib/make-styles";
import { fontFamilies, fontSize, radius } from "@/lib/themes";

import { Text } from "@/components/ui/Text";

export type FormTextFieldProps = {
  label: string;
  value?: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  accessibilityLabel?: string;
};

/** A labeled, themed text input for single-line, numeric, phone, and multiline form values. */
export function FormTextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  required,
  keyboardType,
  multiline,
  accessibilityLabel,
}: FormTextFieldProps) {
  const styles = useStyles();

  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        accessibilityLabel={accessibilityLabel ?? label}
        autoCapitalize={keyboardType === "phone-pad" ? "none" : "sentences"}
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={styles.placeholder.color}
        style={[
          styles.input,
          multiline && styles.multilineInput,
          error && styles.inputError,
        ]}
        textAlignVertical={multiline ? "top" : "center"}
        value={value ?? ""}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  field: {
    gap: 7,
  },
  label: {
    color: theme.foreground,
    fontFamily: fontFamilies.base.semiBold,
    fontSize: fontSize.sm,
  },
  required: {
    color: theme.destructive,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: theme.input,
    borderRadius: radius.xl,
    backgroundColor: theme.background,
    color: theme.foreground,
    fontFamily: fontFamilies.base.regular,
    fontSize: fontSize.md,
  },
  multilineInput: {
    minHeight: 88,
    lineHeight: 21,
  },
  inputError: {
    borderColor: theme.destructive,
  },
  placeholder: {
    color: theme.mutedForeground,
  },
  error: {
    color: theme.destructive,
    fontSize: fontSize.sm,
  },
}));
