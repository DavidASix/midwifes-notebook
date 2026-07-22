import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {
  CalendarDays,
  ChevronDown,
  HeartPulse,
  Phone,
  UserRound,
  UsersRound,
} from "lucide-react-native";

import { bloodTypes, gbsStatuses, rhStatuses } from "@/db/schema";
import {
  fromIsoDate,
  toIsoDate,
  type ClientFormErrors,
  type ClientFormValues,
} from "@/lib/client-form";
import { makeStyles } from "@/lib/make-styles";
import { useTheme } from "@/lib/theme-context";
import { fontFamilies, fontSize, radius } from "@/lib/themes";

import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";

type ClientFormProps = {
  values: ClientFormValues;
  errors: ClientFormErrors;
  submitError?: string;
  isSubmitting: boolean;
  onChange: <K extends keyof ClientFormValues>(
    field: K,
    value: ClientFormValues[K],
  ) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

type TextFieldProps = {
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

function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  required,
  keyboardType,
  multiline,
  accessibilityLabel,
}: TextFieldProps) {
  const styles = useStyles();
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
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
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

type ChoiceGroupProps<T extends string | number> = {
  label: string;
  values: readonly T[];
  value?: T;
  onChange: (value: T | undefined) => void;
  getLabel?: (value: T) => string;
  error?: string;
};

function ChoiceGroup<T extends string | number>({
  label,
  values,
  value,
  onChange,
  getLabel = String,
  error,
}: ChoiceGroupProps<T>) {
  const styles = useStyles();
  return (
    <View style={styles.field}>
      <View style={styles.choiceLabelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {value !== undefined && (
          <Text style={styles.optionalHint}>Tap again to clear</Text>
        )}
      </View>
      <View
        accessibilityLabel={label}
        accessibilityRole="radiogroup"
        style={styles.choiceRow}
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
              style={styles.choiceButton}
              title={getLabel(option)}
              variant={selected ? "primary" : "secondary"}
            />
          );
        })}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

type DateFieldProps = {
  label: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  error?: string;
  maximumDate?: Date;
  defaultDate?: Date;
};

function DateField({
  label,
  value,
  onChange,
  error,
  maximumDate,
  defaultDate,
}: DateFieldProps) {
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
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.dateRow}>
        <Button
          accessibilityLabel={`${label}: ${displayValue}`}
          onPress={() => setIsOpen(true)}
          style={styles.dateButton}
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
        <View style={styles.datePicker}>
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
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

function SectionCard({
  icon,
  title,
  description,
  children,
  collapsible = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  collapsible?: boolean;
}) {
  const styles = useStyles();
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(!collapsible);
  const heading = (
    <>
      <View style={styles.sectionIcon}>{icon}</View>
      <View style={styles.sectionHeading}>
        <Text header style={styles.sectionTitle}>
          {title}
        </Text>
        <Text style={styles.sectionDescription}>{description}</Text>
      </View>
      {collapsible && (
        <ChevronDown
          color={theme.primary}
          size={22}
          style={isExpanded ? styles.expandedChevron : undefined}
        />
      )}
    </>
  );

  return (
    <View style={styles.sectionCard}>
      {collapsible ? (
        <Button
          accessibilityLabel={`${isExpanded ? "Collapse" : "Expand"} ${title} section`}
          accessibilityState={{ expanded: isExpanded }}
          onPress={() => setIsExpanded((current) => !current)}
          size="bare"
          style={styles.sectionHeader}
          variant="ghost"
        >
          {heading}
        </Button>
      ) : (
        <View style={styles.sectionHeader}>{heading}</View>
      )}
      {isExpanded && <View style={styles.sectionFields}>{children}</View>}
    </View>
  );
}

/** Renders all editable client fields using controls matched to their stored data types. */
export function ClientForm({
  values,
  errors,
  submitError,
  isSubmitting,
  onChange,
  onSubmit,
  onCancel,
}: ClientFormProps) {
  const styles = useStyles();
  const theme = useTheme();
  const today = new Date();
  const typicalBirthDate = new Date(
    today.getFullYear() - 30,
    today.getMonth(),
    today.getDate(),
    12,
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.intro}>
          <Text header style={styles.introTitle}>
            Begin with the essentials.
          </Text>
          <Text style={styles.introCopy}>
            Only a first and last name are required. Everything else can be
            added now or later.
          </Text>
        </View>

        {submitError && (
          <View accessibilityRole="alert" style={styles.submitError}>
            <Text style={styles.submitErrorText}>{submitError}</Text>
          </View>
        )}

        <SectionCard
          description="Names and ways to get in touch"
          icon={<UserRound color={theme.primary} size={20} />}
          title="Identity"
        >
          <View style={styles.twoColumnRow}>
            <View style={styles.column}>
              <TextField
                error={errors.firstName}
                label="First name"
                onChangeText={(value) => onChange("firstName", value)}
                placeholder="Amina"
                required
                value={values.firstName}
              />
            </View>
            <View style={styles.column}>
              <TextField
                error={errors.lastName}
                label="Last name"
                onChangeText={(value) => onChange("lastName", value)}
                placeholder="Yusuf"
                required
                value={values.lastName}
              />
            </View>
          </View>
          <View style={styles.twoColumnRow}>
            <View style={styles.column}>
              <TextField
                label="Middle name"
                onChangeText={(value) => onChange("middleName", value)}
                placeholder="Optional"
                value={values.middleName}
              />
            </View>
            <View style={styles.column}>
              <TextField
                label="Preferred name"
                onChangeText={(value) => onChange("preferredName", value)}
                placeholder="Optional"
                value={values.preferredName}
              />
            </View>
          </View>
          <TextField
            label="Address"
            multiline
            onChangeText={(value) => onChange("address", value)}
            placeholder="Street, city, province"
            value={values.address}
          />
          <TextField
            accessibilityLabel="Primary phone number"
            keyboardType="phone-pad"
            label="Primary phone"
            onChangeText={(value) => onChange("primaryPhone", value)}
            placeholder="(416) 555-0123"
            value={values.primaryPhone}
          />
          <View style={styles.divider} />
          <Text style={styles.subheading}>Age information</Text>
          <Text style={styles.helperText}>
            Choose a birth date, or enter an age only when the date is unknown.
          </Text>
          <DateField
            defaultDate={typicalBirthDate}
            error={errors.dateOfBirth}
            label="Date of birth"
            maximumDate={today}
            onChange={(value) => {
              onChange("dateOfBirth", value);
              if (value) onChange("age", undefined);
            }}
            value={values.dateOfBirth}
          />
          <TextField
            error={errors.age}
            keyboardType="number-pad"
            label="Age, if birth date is unknown"
            onChangeText={(value) => {
              onChange("age", value);
              if (value.trim()) onChange("dateOfBirth", undefined);
            }}
            placeholder="Not set"
            value={values.age}
          />
        </SectionCard>

        <SectionCard
          collapsible
          description="Pregnancy and clinical details"
          icon={<HeartPulse color={theme.primary} size={20} />}
          title="Clinical"
        >
          <DateField
            label="Estimated delivery date"
            onChange={(value) => onChange("estimatedDeliveryDate", value)}
            value={values.estimatedDeliveryDate}
          />
          <View style={styles.twoColumnRow}>
            <View style={styles.column}>
              <TextField
                error={errors.gravida}
                keyboardType="number-pad"
                label="Gravida"
                onChangeText={(value) => onChange("gravida", value)}
                placeholder="Total pregnancies"
                value={values.gravida}
              />
            </View>
            <View style={styles.column}>
              <TextField
                error={errors.parity}
                keyboardType="number-pad"
                label="Parity"
                onChangeText={(value) => onChange("parity", value)}
                placeholder="Total deliveries"
                value={values.parity}
              />
            </View>
          </View>
          <ChoiceGroup
            label="Blood type"
            onChange={(value) => onChange("bloodType", value)}
            value={values.bloodType}
            values={bloodTypes}
          />
          <View style={styles.twoColumnRow}>
            <View style={styles.column}>
              <ChoiceGroup
                getLabel={(value) => (value === "+" ? "Positive" : "Negative")}
                label="Rh status"
                onChange={(value) => onChange("rhStatus", value)}
                value={values.rhStatus}
                values={rhStatuses}
              />
            </View>
            <View style={styles.column}>
              <ChoiceGroup
                getLabel={(value) => (value === "+" ? "Positive" : "Negative")}
                label="GBS status"
                onChange={(value) => onChange("gbsStatus", value)}
                value={values.gbsStatus}
                values={gbsStatuses}
              />
            </View>
          </View>
          <TextField
            label="Risk factors"
            multiline
            onChangeText={(value) => onChange("riskFactors", value)}
            placeholder="Clinical considerations, history, or concerns"
            value={values.riskFactors}
          />
        </SectionCard>

        <SectionCard
          collapsible
          description="Partner or emergency-contact information"
          icon={<UsersRound color={theme.primary} size={20} />}
          title="Partner"
        >
          <TextField
            label="Partner name"
            onChangeText={(value) => onChange("partnerName", value)}
            placeholder="Full name"
            value={values.partnerName}
          />
          <TextField
            label="Relationship"
            onChangeText={(value) => onChange("partnerRelationship", value)}
            placeholder="Partner, spouse, support person…"
            value={values.partnerRelationship}
          />
          <View style={styles.phoneLabel}>
            <Phone color={theme.mutedForeground} size={16} />
            <Text style={styles.subheading}>Emergency contact</Text>
          </View>
          <TextField
            accessibilityLabel="Partner phone number"
            keyboardType="phone-pad"
            label="Partner phone"
            onChangeText={(value) => onChange("partnerPhone", value)}
            placeholder="(416) 555-0123"
            value={values.partnerPhone}
          />
          <ChoiceGroup
            label="Partner blood type"
            onChange={(value) => onChange("partnerBloodType", value)}
            value={values.partnerBloodType}
            values={bloodTypes}
          />
        </SectionCard>

        <View style={styles.privacyNote}>
          <CalendarDays color={theme.secondary} size={18} />
          <Text style={styles.privacyText}>
            Client information stays encrypted on this device.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          disabled={isSubmitting}
          onPress={onCancel}
          style={styles.footerButton}
          title="Cancel"
          variant="secondary"
        />
        <Button
          disabled={isSubmitting}
          onPress={onSubmit}
          style={styles.footerButton}
          title={isSubmitting ? "Adding client…" : "Add client"}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 26,
    gap: 16,
  },
  intro: {
    paddingHorizontal: 4,
    gap: 5,
  },
  introTitle: {
    color: theme.primary,
    fontFamily: fontFamilies.heading.bold,
    fontSize: fontSize["2xl"],
  },
  introCopy: {
    color: theme.mutedForeground,
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  submitError: {
    padding: 13,
    borderWidth: 1,
    borderColor: theme.destructive,
    borderRadius: radius.xl,
    backgroundColor: theme.card,
  },
  submitErrorText: {
    color: theme.destructive,
    fontFamily: fontFamilies.base.medium,
    fontSize: fontSize.sm,
    lineHeight: 19,
  },
  sectionCard: {
    padding: 16,
    gap: 18,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius["3xl"],
    backgroundColor: theme.card,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: theme.accent,
  },
  sectionHeading: {
    flex: 1,
    gap: 1,
  },
  expandedChevron: {
    transform: [{ rotate: "180deg" }],
  },
  sectionTitle: {
    color: theme.foreground,
    fontFamily: fontFamilies.heading.bold,
    fontSize: fontSize.xl,
  },
  sectionDescription: {
    color: theme.mutedForeground,
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  sectionFields: {
    gap: 15,
  },
  field: {
    gap: 7,
  },
  fieldLabel: {
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
  errorText: {
    color: theme.destructive,
    fontSize: fontSize.sm,
  },
  twoColumnRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  column: {
    flex: 1,
    minWidth: 0,
  },
  choiceLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  optionalHint: {
    color: theme.mutedForeground,
    fontSize: fontSize.xs,
  },
  choiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  choiceButton: {
    flexGrow: 1,
    minWidth: 68,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateButton: {
    flex: 1,
  },
  datePicker: {
    overflow: "hidden",
    borderRadius: radius.xl,
    backgroundColor: theme.background,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
  },
  subheading: {
    color: theme.foreground,
    fontFamily: fontFamilies.base.semiBold,
    fontSize: fontSize.sm,
  },
  helperText: {
    color: theme.mutedForeground,
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  phoneLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  privacyNote: {
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  privacyText: {
    color: theme.mutedForeground,
    fontSize: fontSize.sm,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 26 : 14,
    flexDirection: "row",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.background,
  },
  footerButton: {
    flex: 1,
  },
}));
