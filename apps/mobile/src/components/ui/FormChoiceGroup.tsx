import { View } from "react-native";

import { makeStyles } from "@/lib/make-styles";
import { fontFamilies, fontSize } from "@/lib/themes";

import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";

export type FormChoiceGroupProps<T extends string | number> = {
  label: string;
  values: readonly T[];
  value?: T;
  onChange: (value: T | undefined) => void;
  getLabel?: (value: T) => string;
  error?: string;
};

/** A nullable segmented choice group whose selected option can be tapped again to clear it. */
export function FormChoiceGroup<T extends string | number>({
  label,
  values,
  value,
  onChange,
  getLabel = String,
  error,
}: FormChoiceGroupProps<T>) {
  const styles = useStyles();

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {value !== undefined && (
          <Text style={styles.optionalHint}>Tap again to clear</Text>
        )}
      </View>
      <View
        accessibilityLabel={label}
        accessibilityRole="radiogroup"
        style={styles.choices}
      >
        {values.map((option) => {
          const selected = option === value;
          return (
            <Button
              key={String(option)}
              accessibilityLabel={`${label}: ${getLabel(option)}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => onChange(selected ? undefined : option)}
              size="compact"
              style={styles.choice}
              title={getLabel(option)}
              variant={selected ? "primary" : "secondary"}
            />
          );
        })}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  field: {
    gap: 7,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  label: {
    color: theme.foreground,
    fontFamily: fontFamilies.base.semiBold,
    fontSize: fontSize.sm,
  },
  optionalHint: {
    color: theme.mutedForeground,
    fontSize: fontSize.xs,
  },
  choices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  choice: {
    flexGrow: 1,
    minWidth: 68,
  },
  error: {
    color: theme.destructive,
    fontSize: fontSize.sm,
  },
}));
