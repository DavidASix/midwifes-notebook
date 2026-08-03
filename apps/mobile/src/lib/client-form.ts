import { z } from "zod";

import { clients, clientsSchema } from "@/db/schema";
import { optionalIntegerSchema } from "@/lib/types";

const clientFormFieldsSchema = clientsSchema
  .omit({
    id: true,
    actualDeliveryDate: true,
    deliveryMethod: true,
    tearDegree: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
  })
  .partial()
  .extend({
    firstName: z
      .string({ error: "First name is required." })
      .trim()
      .min(1, "First name is required."),
    lastName: z
      .string({ error: "Last name is required." })
      .trim()
      .min(1, "Last name is required."),
    age: optionalIntegerSchema,
    gravida: optionalIntegerSchema,
    parity: optionalIntegerSchema,
  });

type ClientFormSchemaInput = z.input<typeof clientFormFieldsSchema>;

export type ClientFormValues = {
  [Field in keyof ClientFormSchemaInput]?: Exclude<
    ClientFormSchemaInput[Field],
    null
  >;
};

export type ClientFormErrors = Partial<Record<keyof ClientFormValues, string>>;

export const initialClientFormValues: ClientFormValues = {};

export type ClientFormResult =
  | { success: true; data: typeof clients.$inferInsert }
  | { success: false; errors: ClientFormErrors };

/** Converts a Date to an ISO calendar date without applying a UTC timezone shift. */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Parses an ISO calendar date into local midday to avoid daylight-saving boundary shifts. */
export function fromIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

/** Builds the runtime form contract using the current date for time-dependent rules. */
function createClientFormSchema(today: Date) {
  const todayIso = toIsoDate(today);

  return clientFormFieldsSchema.superRefine((values, context) => {
    if (values.dateOfBirth && values.age !== undefined) {
      context.addIssue({
        code: "custom",
        path: ["age"],
        message: "Use either date of birth or age, not both.",
      });
    }
    if (values.dateOfBirth && values.dateOfBirth > todayIso) {
      context.addIssue({
        code: "custom",
        path: ["dateOfBirth"],
        message: "Date of birth cannot be in the future.",
      });
    }
    if (
      values.gravida !== undefined &&
      values.parity !== undefined &&
      values.parity > values.gravida
    ) {
      context.addIssue({
        code: "custom",
        path: ["parity"],
        message: "Parity cannot be greater than gravida.",
      });
    }
  });
}

/** Validates form decisions and produces a database-ready client insert without blank nullable values. */
export function buildClientInsert(
  values: ClientFormValues,
  today = new Date(),
): ClientFormResult {
  const result = createClientFormSchema(today).safeParse(values);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: ClientFormErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof ClientFormValues | undefined;
    if (field !== undefined && errors[field] === undefined) {
      errors[field] =
        issue.code === "invalid_format" &&
        (field === "dateOfBirth" || field === "estimatedDeliveryDate")
          ? "Enter a valid date."
          : issue.message;
    }
  }
  return { success: false, errors };
}
