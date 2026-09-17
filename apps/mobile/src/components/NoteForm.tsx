import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { FileText, Save, Trash2 } from "lucide-react-native";

import { Button } from "@/components/ui/Button";
import { FormTextField } from "@/components/ui/FormTextField";
import { Text } from "@/components/ui/Text";
import { type NoteFormErrors, type NoteFormValues } from "@/lib/note-form";
import { makeStyles } from "@/lib/make-styles";
import { useTheme } from "@/lib/theme-context";
import { fontFamilies, fontSize, useFormBottomPadding } from "@/lib/themes";

type NoteFormProps = {
  mode: "create" | "edit";
  values: NoteFormValues;
  errors: NoteFormErrors;
  isSubmitting: boolean;
  isArchiving?: boolean;
  onChange: <K extends keyof NoteFormValues>(
    field: K,
    value: NoteFormValues[K],
  ) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onArchive?: () => void;
};

/** Renders the shared create/edit note form with fixed actions and optional archival. */
export function NoteForm({
  mode,
  values,
  errors,
  isSubmitting,
  isArchiving = false,
  onChange,
  onSubmit,
  onCancel,
  onArchive,
}: NoteFormProps) {
  const styles = useStyles();
  const theme = useTheme();
  const footerBottomPadding = useFormBottomPadding(false);
  const isPending = isSubmitting || isArchiving;

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
            <FileText color={theme.primary} size={21} />
          </View>
          <View style={styles.introCopy}>
            <Text header style={styles.title}>
              {mode === "create" ? "Client note" : "Note details"}
            </Text>
            <Text style={styles.description}>
              {mode === "create"
                ? "Capture a visit, update, or reminder for this client."
                : "Review or update this client note."}
            </Text>
          </View>
        </View>

        <View style={styles.fields}>
          <FormTextField
            disabled={isPending}
            error={errors.title}
            label="Title"
            onChangeText={(value) => onChange("title", value)}
            placeholder="Optional title"
            value={values.title}
          />
          <FormTextField
            disabled={isPending}
            error={errors.content}
            label="Note"
            multiline
            multilineMinHeight={220}
            onChangeText={(value) => onChange("content", value)}
            placeholder="Write your note…"
            required
            value={values.content}
          />
        </View>

        {mode === "edit" && onArchive && (
          <View style={styles.archiveSection}>
            <View style={styles.archiveCopy}>
              <Text style={styles.archiveTitle}>Delete Note</Text>
              <Text style={styles.archiveDescription}>
                This note will be hidden but remain stored locally.
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

        <Text style={styles.privacyText}>
          Notes stay encrypted on this device.
        </Text>
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
          title={isSubmitting ? "Saving…" : "Save note"}
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
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 28,
    gap: 24,
  },
  intro: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  icon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: theme.accent,
  },
  introCopy: {
    flex: 1,
    gap: 2,
  },
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
  fields: {
    gap: 18,
  },
  archiveSection: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: theme.destructive,
    borderRadius: 12,
  },
  archiveCopy: {
    flex: 1,
    gap: 4,
  },
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
  privacyText: {
    paddingTop: 2,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    color: theme.mutedForeground,
    fontSize: fontSize.sm,
    lineHeight: 34,
    textAlign: "center",
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
  footerButton: {
    flex: 1,
  },
}));
