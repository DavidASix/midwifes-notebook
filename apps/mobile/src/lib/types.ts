import { z } from "zod";

/** Decodes an optional integer text input. */
export const optionalIntegerSchema = z
  .string()
  .optional()
  .transform((value) =>
    value === undefined || value === "" ? undefined : Number(value),
  )
  .pipe(
    z
      .number({ error: "Enter a whole number." })
      .int("Enter a whole number.")
      .optional(),
  );
