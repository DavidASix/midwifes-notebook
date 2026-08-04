import { useState } from "react";
import { Platform, View } from "react-native";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  HeartPulse,
  Phone,
  UserRound,
  UserRoundPlus,
  UsersRound,
} from "lucide-react-native";

import { bloodTypes, gbsStatuses, rhStatuses } from "@/db/schema";
import {
  type ClientFormErrors,
  type ClientFormValues,
} from "@/lib/client-form";
import { makeStyles } from "@/lib/make-styles";
import { useTheme } from "@/lib/theme-context";
import { fontFamilies, fontSize } from "@/lib/themes";

import { Button } from "@/components/ui/Button";
import { BottomSheetKeyboardAwareScrollView } from "@/components/ui/BottomSheetKeyboardAwareScrollView";
import { FormChoiceGroup } from "@/components/ui/FormChoiceGroup";
import { FormDateField } from "@/components/ui/FormDateField";
import { FormIntegerField } from "@/components/ui/FormIntegerField";
import { FormTextField } from "@/components/ui/FormTextField";
import { Text } from "@/components/ui/Text";

type ClientFormProps = {
  values: ClientFormValues;
  errors: ClientFormErrors;
  isSubmitting: boolean;
  onChange: <K extends keyof ClientFormValues>(
    field: K,
    value: ClientFormValues[K],
  ) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

function FormSection({
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
      {collapsible &&
        (isExpanded ? (
          <ChevronUp color={theme.primary} size={22} />
        ) : (
          <ChevronDown color={theme.primary} size={22} />
        ))}
    </>
  );

  return (
    <View style={[styles.section, collapsible && styles.collapsibleSection]}>
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
    <>
      <BottomSheetKeyboardAwareScrollView
        bottomOffset={12}
        contentContainerStyle={styles.content}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        style={styles.container}
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

        <FormSection
          description="Names and ways to get in touch"
          icon={<UserRound color={theme.primary} size={20} />}
          title="Identity"
        >
          <View style={styles.twoColumnRow}>
            <View style={styles.column}>
              <FormTextField
                error={errors.firstName}
                label="First name"
                onChangeText={(value) => onChange("firstName", value)}
                placeholder="Amina"
                required
                value={values.firstName}
              />
            </View>
            <View style={styles.column}>
              <FormTextField
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
              <FormTextField
                label="Middle name"
                onChangeText={(value) => onChange("middleName", value)}
                placeholder="Optional"
                value={values.middleName}
              />
            </View>
            <View style={styles.column}>
              <FormTextField
                label="Preferred name"
                onChangeText={(value) => onChange("preferredName", value)}
                placeholder="Optional"
                value={values.preferredName}
              />
            </View>
          </View>
          <FormTextField
            label="Address"
            multiline
            onChangeText={(value) => onChange("address", value)}
            placeholder="Street, city, province"
            value={values.address}
          />
          <FormTextField
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
          <FormDateField
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
          <FormIntegerField
            error={errors.age}
            label="Age, if birth date is unknown"
            onChange={(value) => {
              onChange("age", value);
              if (value !== undefined) onChange("dateOfBirth", undefined);
            }}
            placeholder="Not set"
            value={values.age}
          />
        </FormSection>

        <FormSection
          collapsible
          description="Pregnancy and clinical details"
          icon={<HeartPulse color={theme.primary} size={20} />}
          title="Clinical"
        >
          <FormDateField
            error={errors.estimatedDeliveryDate}
            label="Estimated delivery date"
            onChange={(value) => onChange("estimatedDeliveryDate", value)}
            value={values.estimatedDeliveryDate}
          />
          <View style={styles.twoColumnRow}>
            <View style={styles.column}>
              <FormIntegerField
                error={errors.gravida}
                label="Gravida"
                onChange={(value) => onChange("gravida", value)}
                placeholder="Total pregnancies"
                value={values.gravida}
              />
            </View>
            <View style={styles.column}>
              <FormIntegerField
                error={errors.parity}
                label="Parity"
                onChange={(value) => onChange("parity", value)}
                placeholder="Total deliveries"
                value={values.parity}
              />
            </View>
          </View>
          <FormChoiceGroup
            label="Blood type"
            onChange={(value) => onChange("bloodType", value)}
            value={values.bloodType}
            values={bloodTypes}
          />
          <View style={styles.twoColumnRow}>
            <View style={styles.column}>
              <FormChoiceGroup
                getLabel={(value) => (value === "+" ? "Positive" : "Negative")}
                label="Rh status"
                onChange={(value) => onChange("rhStatus", value)}
                value={values.rhStatus}
                values={rhStatuses}
              />
            </View>
            <View style={styles.column}>
              <FormChoiceGroup
                getLabel={(value) => (value === "+" ? "Positive" : "Negative")}
                label="GBS status"
                onChange={(value) => onChange("gbsStatus", value)}
                value={values.gbsStatus}
                values={gbsStatuses}
              />
            </View>
          </View>
          <FormTextField
            label="Risk factors"
            multiline
            onChangeText={(value) => onChange("riskFactors", value)}
            placeholder="Clinical considerations, history, or concerns"
            value={values.riskFactors}
          />
        </FormSection>

        <FormSection
          collapsible
          description="Partner or emergency-contact information"
          icon={<UsersRound color={theme.primary} size={20} />}
          title="Partner"
        >
          <FormTextField
            label="Partner name"
            onChangeText={(value) => onChange("partnerName", value)}
            placeholder="Full name"
            value={values.partnerName}
          />
          <FormTextField
            label="Relationship"
            onChangeText={(value) => onChange("partnerRelationship", value)}
            placeholder="Partner, spouse, support person…"
            value={values.partnerRelationship}
          />
          <View style={styles.phoneLabel}>
            <Phone color={theme.mutedForeground} size={16} />
            <Text style={styles.subheading}>Emergency contact</Text>
          </View>
          <FormTextField
            accessibilityLabel="Partner phone number"
            keyboardType="phone-pad"
            label="Partner phone"
            onChangeText={(value) => onChange("partnerPhone", value)}
            placeholder="(416) 555-0123"
            value={values.partnerPhone}
          />
          <FormChoiceGroup
            label="Partner blood type"
            onChange={(value) => onChange("partnerBloodType", value)}
            value={values.partnerBloodType}
            values={bloodTypes}
          />
        </FormSection>

        <View style={styles.privacyNote}>
          <View style={styles.privacyDivider} />
          <View style={styles.privacyContent}>
            <CalendarDays color={theme.secondary} size={18} />
            <Text style={styles.privacyText}>
              Client information stays encrypted on this device.
            </Text>
          </View>
        </View>
      </BottomSheetKeyboardAwareScrollView>

      <View style={styles.footer}>
        <Button
          disabled={isSubmitting}
          onPress={onCancel}
          size="compact"
          style={styles.footerButton}
          title="Cancel"
          variant="secondary"
        />
        <Button
          disabled={isSubmitting}
          icon={<UserRoundPlus color={theme.primaryForeground} size={17} />}
          onPress={onSubmit}
          size="compact"
          style={styles.footerButton}
          title={isSubmitting ? "Adding client…" : "Add client"}
        />
      </View>
    </>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    flex: 1,
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
  section: {
    gap: 18,
  },
  collapsibleSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
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
  twoColumnRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  column: {
    flex: 1,
    minWidth: 0,
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
    paddingTop: 4,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 14,
  },
  privacyDivider: {
    width: "100%",
    height: 1,
    backgroundColor: theme.border,
  },
  privacyContent: {
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
    paddingBottom: Platform.OS === "ios" ? 26 : 20,
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
