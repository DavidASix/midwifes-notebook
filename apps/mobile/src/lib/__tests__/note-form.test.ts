import { notesSchema, type NoteRecord } from "@/db/schema";
import {
  buildNoteInsert,
  buildNoteUpdate,
  noteToFormValues,
} from "@/lib/note-form";

/** Builds a valid note row while allowing tests to vary relevant fields. */
function makeNote(overrides: Partial<NoteRecord> = {}): NoteRecord {
  return {
    id: 4,
    clientId: 2,
    title: "Follow-up",
    content: "Discussed feeding plan.",
    createdAt: "2026-09-16T20:00:00.000Z",
    updatedAt: "2026-09-16T20:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}

describe("note form decisions", () => {
  /** Verifies normalization of optional titles and required content for inserts. */
  it("normalizes an optional title and required content for insertion", () => {
    expect(
      buildNoteInsert(2, {
        title: "  Follow-up  ",
        content: "  Discussed feeding plan.  ",
      }),
    ).toEqual({
      success: true,
      data: {
        clientId: 2,
        title: "Follow-up",
        content: "Discussed feeding plan.",
      },
    });
  });

  /** Verifies that whitespace-only note content fails validation. */
  it("rejects blank note content", () => {
    const result = buildNoteInsert(2, { title: "Reminder", content: "   " });

    expect(result.success).toBe(false);
    if (result.success)
      throw new Error("Expected blank content to be rejected");
    expect(result.errors).toHaveProperty("content");
  });

  /** Verifies runtime validation rejects persisted rows without content. */
  it("rejects persisted notes without required content", () => {
    const row = { ...makeNote(), content: null };

    expect(notesSchema.safeParse(row).success).toBe(false);
  });

  /** Verifies that updates persist an empty optional title as SQL null. */
  it("clears a blank title explicitly during updates", () => {
    expect(buildNoteUpdate({ title: "", content: "Updated note" })).toEqual({
      success: true,
      data: { title: null, content: "Updated note" },
    });
  });

  /** Verifies nullable persisted titles map to controlled input values. */
  it("maps a nullable persisted title to a controlled form value", () => {
    expect(noteToFormValues(makeNote({ title: null }))).toEqual({
      title: "",
      content: "Discussed feeding plan.",
    });
  });
});
