import { z } from "zod";

import { notes, type NoteRecord } from "@/db/schema";

const noteFormSchema = z.object({
  title: z.string().trim().optional(),
  content: z
    .string({ error: "Note content is required." })
    .trim()
    .min(1, "Note content is required."),
});

export type NoteFormValues = z.input<typeof noteFormSchema>;
export type NoteFormErrors = Partial<Record<keyof NoteFormValues, string>>;

export const initialNoteFormValues: NoteFormValues = {
  title: "",
  content: "",
};

export type NoteInsertResult =
  | { success: true; data: typeof notes.$inferInsert }
  | { success: false; errors: NoteFormErrors };

export type NoteUpdateResult =
  | {
      success: true;
      data: Pick<typeof notes.$inferInsert, "title" | "content">;
    }
  | { success: false; errors: NoteFormErrors };

/** Maps Zod issues to the fields displayed by the note form. */
function getNoteFormErrors(error: z.ZodError): NoteFormErrors {
  return Object.fromEntries(
    error.issues.map((issue) => [issue.path[0], issue.message]),
  );
}

/** Validates note input and produces a normalized insert for one client. */
export function buildNoteInsert(
  clientId: number,
  values: NoteFormValues,
): NoteInsertResult {
  const parsedClientId = z.int().positive().safeParse(clientId);
  const parsedValues = noteFormSchema.safeParse(values);
  if (!parsedClientId.success || !parsedValues.success) {
    return {
      success: false,
      errors: parsedValues.success ? {} : getNoteFormErrors(parsedValues.error),
    };
  }

  return {
    success: true,
    data: {
      clientId: parsedClientId.data,
      title: parsedValues.data.title || null,
      content: parsedValues.data.content,
    },
  };
}

/** Converts a persisted note into editable form values. */
export function noteToFormValues(note: NoteRecord): NoteFormValues {
  return {
    title: note.title ?? "",
    content: note.content,
  };
}

/** Validates edits and explicitly clears an omitted optional title. */
export function buildNoteUpdate(values: NoteFormValues): NoteUpdateResult {
  const result = noteFormSchema.safeParse(values);
  if (!result.success) {
    return { success: false, errors: getNoteFormErrors(result.error) };
  }

  return {
    success: true,
    data: { title: result.data.title || null, content: result.data.content },
  };
}
