import { useState } from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Baby, Save, Trash2 } from "lucide-react-native";

import { Button } from "@/components/ui/Button";
import { FormChoiceGroup } from "@/components/ui/FormChoiceGroup";
import { FormDateField } from "@/components/ui/FormDateField";
import { FormDecimalField } from "@/components/ui/FormDecimalField";
import { FormIntegerField } from "@/components/ui/FormIntegerField";
import { FormTextField } from "@/components/ui/FormTextField";
import { Text } from "@/components/ui/Text";
import { babyOutcomes, babySexes, bloodTypes, feedingTypes } from "@/db/schema";
import {
  babyOutcomeLabels,
  feedingTypeLabels,
  gramsToPoundsOunces,
  poundsOuncesToGrams,
  type BabyFormErrors,
  type BabyFormValues,
} from "@/lib/baby-form";
import { makeStyles } from "@/lib/make-styles";
import { useTheme } from "@/lib/theme-context";
import { fontFamilies, fontSize, useFormBottomPadding } from "@/lib/themes";

type BabyFormProps = {
  mode: "create" | "edit";
  values: BabyFormValues;
  errors: BabyFormErrors;
  isSubmitting: boolean;
  isArchiving?: boolean;
  onChange: <K extends keyof BabyFormValues>(
    field: K,
    value: BabyFormValues[K],
  ) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onArchive?: () => void;
};

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <Text header style={styles.sectionTitle}>
        {title}
      </Text>
      <View style={styles.sectionDivider} />
      <View style={styles.fields}>{children}</View>
    </View>
  );
}

/** Renders the shared create/edit baby-record form with fixed actions. */
export function BabyForm({
  mode,
  values,
  errors,
  isSubmitting,
  isArchiving = false,
  onChange,
  onSubmit,
  onCancel,
  onArchive,
}: BabyFormProps) {
  const styles = useStyles();
  const theme = useTheme();
  const footerBottomPadding = useFormBottomPadding(false);
  const [weightMode, setWeightMode] = useState<"grams" | "lb-oz">("grams");
  const isPending = isSubmitting || isArchiving;
  const converted =
    values.birthWeightGrams === undefined
      ? { pounds: undefined, ounces: undefined }
      : gramsToPoundsOunces(values.birthWeightGrams);

  function changeImperialWeight(
    pounds: number | undefined,
    ounces: number | undefined,
  ) {
    if (pounds === undefined && ounces === undefined) {
      onChange("birthWeightGrams", undefined);
      return;
    }
    onChange("birthWeightGrams", poundsOuncesToGrams(pounds ?? 0, ounces ?? 0));
  }

  return (
    <>
      <KeyboardAwareScrollView
        bottomOffset={12}
        contentContainerStyle={styles.content}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        style={styles.container}
      >
        <View style={styles.intro}>
          <View style={styles.icon}>
            <Baby color={theme.primary} size={22} />
          </View>
          <View style={styles.introCopy}>
            <Text header style={styles.title}>
              Baby record
            </Text>
            <Text style={styles.description}>
              All details are optional and can be added or changed later.
            </Text>
          </View>
        </View>

        <FormSection title="Record details">
          <FormTextField
            disabled={isPending}
            error={errors.name}
            label="Name"
            onChangeText={(value) => onChange("name", value)}
            placeholder="Optional name"
            value={values.name}
          />
          <FormChoiceGroup
            disabled={isPending}
            error={errors.outcome}
            getLabel={(value) => babyOutcomeLabels[value]}
            label="Outcome"
            onChange={(value) => onChange("outcome", value)}
            value={values.outcome}
            values={babyOutcomes}
          />
          <FormDateField
            disabled={isPending}
            error={errors.eventDate}
            label={
              values.outcome === "live_birth"
                ? "Birth date"
                : values.outcome === "miscarriage" ||
                    values.outcome === "stillbirth"
                  ? "Loss date"
                  : "Event date"
            }
            maximumDate={new Date()}
            onChange={(value) => onChange("eventDate", value)}
            value={values.eventDate}
          />
          <FormChoiceGroup
            disabled={isPending}
            error={errors.sex}
            getLabel={(value) =>
              value === "male"
                ? "Male"
                : value === "female"
                  ? "Female"
                  : "Unknown"
            }
            label="Sex"
            onChange={(value) => onChange("sex", value)}
            value={values.sex}
            values={babySexes}
          />
        </FormSection>

        <FormSection title="Pregnancy details">
          <View style={styles.modeRow}>
            <Button
              disabled={isPending}
              onPress={() => setWeightMode("grams")}
              size="compact"
              title="Grams"
              variant={weightMode === "grams" ? "primary" : "secondary"}
            />
            <Button
              disabled={isPending}
              onPress={() => setWeightMode("lb-oz")}
              size="compact"
              title="lb / oz"
              variant={weightMode === "lb-oz" ? "primary" : "secondary"}
            />
          </View>
          {weightMode === "grams" ? (
            <FormIntegerField
              disabled={isPending}
              error={errors.birthWeightGrams}
              label="Weight (grams)"
              onChange={(value) => onChange("birthWeightGrams", value)}
              value={values.birthWeightGrams}
            />
          ) : (
            <View style={styles.splitFields}>
              <View style={styles.splitField}>
                <FormIntegerField
                  disabled={isPending}
                  label="Pounds"
                  onChange={(value) =>
                    changeImperialWeight(value, converted.ounces)
                  }
                  value={converted.pounds}
                />
              </View>
              <View style={styles.splitField}>
                <FormDecimalField
                  disabled={isPending}
                  label="Ounces"
                  maximumExclusive={16}
                  onChange={(value) =>
                    changeImperialWeight(converted.pounds, value)
                  }
                  value={converted.ounces}
                />
              </View>
            </View>
          )}
          <View style={styles.splitFields}>
            <View style={styles.splitField}>
              <FormIntegerField
                disabled={isPending}
                error={errors.gestationalWeeks}
                label="Gestational weeks"
                onChange={(value) => onChange("gestationalWeeks", value)}
                value={values.gestationalWeeks}
              />
            </View>
            <View style={styles.splitField}>
              <FormIntegerField
                disabled={isPending}
                error={errors.gestationalDays}
                label="Days (0–6)"
                onChange={(value) => onChange("gestationalDays", value)}
                value={values.gestationalDays}
              />
            </View>
          </View>
        </FormSection>

        <FormSection title="Optional clinical details">
          <FormChoiceGroup
            disabled={isPending}
            error={errors.bloodType}
            label="Blood type"
            onChange={(value) => onChange("bloodType", value)}
            value={values.bloodType}
            values={bloodTypes}
          />
          <FormChoiceGroup
            disabled={isPending}
            error={errors.feedingType}
            getLabel={(value) => feedingTypeLabels[value]}
            label="Feeding type"
            onChange={(value) => onChange("feedingType", value)}
            value={values.feedingType}
            values={feedingTypes}
          />
          <FormTextField
            disabled={isPending}
            error={errors.riskFactors}
            label="Risk factors"
            multiline
            multilineMinHeight={100}
            onChangeText={(value) => onChange("riskFactors", value)}
            placeholder="Optional notes"
            value={values.riskFactors}
          />
        </FormSection>

        {mode === "edit" && onArchive && (
          <View style={styles.archiveSection}>
            <View style={styles.archiveCopy}>
              <Text style={styles.archiveTitle}>Delete Baby Record</Text>
              <Text style={styles.archiveDescription}>
                This record will be hidden but remain stored locally.
              </Text>
            </View>
            <Button
              disabled={isPending}
              icon={<Trash2 color={theme.primaryForeground} size={16} />}
              onPress={onArchive}
              size="compact"
              title={isArchiving ? "Deleting…" : "Delete"}
              variant="destructive"
            />
          </View>
        )}
      </KeyboardAwareScrollView>

      <View style={[styles.footer, { paddingBottom: footerBottomPadding }]}>
        <Button
          disabled={isPending}
          onPress={onCancel}
          size="compact"
          style={styles.footerButton}
          title="Cancel"
          variant="secondary"
        />
        <Button
          disabled={isPending}
          icon={<Save color={theme.primaryForeground} size={17} />}
          onPress={onSubmit}
          size="compact"
          style={styles.footerButton}
          title={isSubmitting ? "Saving…" : "Save record"}
        />
      </View>
    </>
  );
}

const useStyles = makeStyles((theme) => ({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 28,
    gap: 24,
  },
  intro: { flexDirection: "row", alignItems: "center", gap: 13 },
  icon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: theme.accent,
  },
  introCopy: { flex: 1, gap: 2 },
  title: {
    color: theme.foreground,
    fontFamily: fontFamilies.heading.bold,
    fontSize: fontSize["2xl"],
  },
  description: {
    color: theme.mutedForeground,
    fontSize: fontSize.sm,
    lineHeight: 19,
  },
  section: { gap: 8 },
  sectionTitle: {
    color: theme.primary,
    fontFamily: fontFamilies.heading.bold,
    fontSize: fontSize.xl,
  },
  sectionDivider: { height: 1, backgroundColor: theme.border },
  fields: { gap: 18, paddingTop: 4 },
  modeRow: { flexDirection: "row", gap: 8 },
  splitFields: { flexDirection: "row", gap: 12 },
  splitField: { flex: 1 },
  archiveSection: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: theme.destructive,
    borderRadius: 12,
  },
  archiveCopy: { flex: 1, gap: 4 },
  archiveTitle: {
    color: theme.foreground,
    fontFamily: fontFamilies.base.semiBold,
    fontSize: fontSize.md,
  },
  archiveDescription: {
    color: theme.mutedForeground,
    fontSize: fontSize.sm,
    lineHeight: 19,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: "row",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.background,
  },
  footerButton: { flex: 1 },
}));
