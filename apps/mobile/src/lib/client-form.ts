import { z } from "zod";

import { clients, clientsSchema } from "@/db/schema";
import { toIsoDate } from "./dates";

const optionalIntegerSchema = z
  .number({ error: "Enter a whole number." })
  .int("Enter a whole number.")
  .optional();

const optionalDateSchema = z.iso
  .date({ error: "Enter a valid date." })
  .optional();

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
    dateOfBirth: optionalDateSchema,
    age: optionalIntegerSchema,
    estimatedDeliveryDate: optionalDateSchema,
    gravida: optionalIntegerSchema,
    parity: optionalIntegerSchema,
  })
  .superRefine((values, context) => {
    const todayIso = toIsoDate(new Date());
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

/** Validates form decisions and produces a database-ready client insert without blank nullable values. */
export function buildClientInsert(values: ClientFormValues): ClientFormResult {
  const result = clientFormFieldsSchema.safeParse(values);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: ClientFormErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof ClientFormValues | undefined;
    if (field !== undefined && errors[field] === undefined) {
      errors[field] = issue.message;
    }
  }
  return { success: false, errors };
}
