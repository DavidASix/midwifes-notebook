import { useState } from "react";
import { Platform, View } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

import { fromIsoDate, toIsoDate } from "@/lib/client-form";
import { makeStyles } from "@/lib/make-styles";
import { useTheme } from "@/lib/theme-context";
import { fontFamilies, fontSize, radius } from "@/lib/themes";

import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";

export type FormDateFieldProps = {
  label: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  error?: string;
  maximumDate?: Date;
  defaultDate?: Date;
};

/** A nullable calendar-date field that presents the native date picker for the current platform. */
export function FormDateField({
  label,
  value,
  onChange,
  error,
  maximumDate,
  defaultDate,
}: FormDateFieldProps) {
  const styles = useStyles();
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  function handleDateChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === "android") setIsOpen(false);
    if (event.type === "set" && selected) onChange(toIsoDate(selected));
  }

  const displayValue = value
    ? fromIsoDate(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Not set";

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Button
          accessibilityLabel={`${label}: ${displayValue}`}
          onPress={() => setIsOpen(true)}
          size="compact"
          style={styles.button}
          title={displayValue}
          variant="secondary"
        />
        {value && (
          <Button
            accessibilityLabel={`Clear ${label}`}
            onPress={() => onChange(undefined)}
            size="compact"
            title="Clear"
            variant="ghost"
          />
        )}
      </View>
      {isOpen && (
        <View style={styles.picker}>
          <DateTimePicker
            accentColor={theme.primary}
            display={Platform.OS === "ios" ? "inline" : "default"}
            maximumDate={maximumDate}
            mode="date"
            onChange={handleDateChange}
            value={value ? fromIsoDate(value) : (defaultDate ?? new Date())}
          />
          {Platform.OS === "ios" && (
            <Button
              onPress={() => setIsOpen(false)}
              size="compact"
              title="Done"
              variant="ghost"
            />
          )}
        </View>
      )}
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  button: {
    flex: 1,
  },
  picker: {
    overflow: "hidden",
    borderRadius: radius.xl,
    backgroundColor: theme.background,
  },
  error: {
    color: theme.destructive,
    fontSize: fontSize.sm,
  },
}));
