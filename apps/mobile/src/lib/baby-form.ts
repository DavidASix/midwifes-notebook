import { z } from "zod";

import {
  babies,
  babyOutcomes,
  babySexes,
  bloodTypes,
  feedingTypes,
  type BabyRecord,
} from "@/db/schema";
import { toIsoDate } from "@/lib/dates";

const optionalTrimmedText = z.string().trim().optional();
const optionalWholeNumber = z.int().nonnegative().optional();

const babyFormSchema = z
  .object({
    name: optionalTrimmedText,
    sex: z.enum(babySexes).optional(),
    outcome: z.enum(babyOutcomes).optional(),
    eventDate: z.iso.date().optional(),
    birthWeightGrams: optionalWholeNumber,
    gestationalWeeks: optionalWholeNumber,
    gestationalDays: z
      .int()
      .min(0, "Days must be from 0 to 6.")
      .max(6, "Days must be from 0 to 6.")
      .optional(),
    bloodType: z.enum(bloodTypes).optional(),
    feedingType: z.enum(feedingTypes).optional(),
    riskFactors: optionalTrimmedText,
  })
  .superRefine((values, context) => {
    if (values.eventDate && values.eventDate > toIsoDate(new Date())) {
      context.addIssue({
        code: "custom",
        path: ["eventDate"],
        message: "Event date cannot be in the future.",
      });
    }
  });

export type BabyFormValues = z.input<typeof babyFormSchema>;
export type BabyFormErrors = Partial<Record<keyof BabyFormValues, string>>;

export const initialBabyFormValues: BabyFormValues = {
  name: "",
  sex: undefined,
  outcome: undefined,
  eventDate: undefined,
  birthWeightGrams: undefined,
  gestationalWeeks: undefined,
  gestationalDays: undefined,
  bloodType: undefined,
  feedingType: undefined,
  riskFactors: "",
};

type BabyMutationData = Pick<
  typeof babies.$inferInsert,
  | "name"
  | "sex"
  | "outcome"
  | "eventDate"
  | "birthWeightGrams"
  | "gestationalAgeDays"
  | "bloodType"
  | "feedingType"
  | "riskFactors"
>;

export type BabyInsertResult =
  | { success: true; data: BabyMutationData & { clientId: number } }
  | { success: false; errors: BabyFormErrors };
export type BabyUpdateResult =
  | { success: true; data: BabyMutationData }
  | { success: false; errors: BabyFormErrors };

function getErrors(error: z.ZodError): BabyFormErrors {
  return Object.fromEntries(
    error.issues.map((issue) => [issue.path[0], issue.message]),
  );
}

function nullable(value: string | undefined): string | null {
  return value || null;
}

function toMutationData(
  values: z.output<typeof babyFormSchema>,
): BabyMutationData {
  const hasGestationalAge =
    values.gestationalWeeks !== undefined ||
    values.gestationalDays !== undefined;
  return {
    name: nullable(values.name),
    sex: values.sex ?? null,
    outcome: values.outcome ?? null,
    eventDate: values.eventDate ?? null,
    birthWeightGrams: values.birthWeightGrams ?? null,
    gestationalAgeDays: hasGestationalAge
      ? (values.gestationalWeeks ?? 0) * 7 + (values.gestationalDays ?? 0)
      : null,
    bloodType: values.bloodType ?? null,
    feedingType: values.feedingType ?? null,
    riskFactors: nullable(values.riskFactors),
  };
}

/** Validates baby input and produces a normalized insert for one client. */
export function buildBabyInsert(
  clientId: number,
  values: BabyFormValues,
): BabyInsertResult {
  const parsedClientId = z.int().positive().safeParse(clientId);
  const parsed = babyFormSchema.safeParse(values);
  if (!parsedClientId.success || !parsed.success) {
    return {
      success: false,
      errors: parsed.success ? {} : getErrors(parsed.error),
    };
  }
  return {
    success: true,
    data: { clientId: parsedClientId.data, ...toMutationData(parsed.data) },
  };
}

/** Validates baby edits and explicitly clears every omitted optional value. */
export function buildBabyUpdate(values: BabyFormValues): BabyUpdateResult {
  const parsed = babyFormSchema.safeParse(values);
  return parsed.success
    ? { success: true, data: toMutationData(parsed.data) }
    : { success: false, errors: getErrors(parsed.error) };
}

/** Converts a persisted baby row to the editable weeks-and-days form model. */
export function babyToFormValues(baby: BabyRecord): BabyFormValues {
  return {
    name: baby.name ?? "",
    sex: baby.sex ?? undefined,
    outcome: baby.outcome ?? undefined,
    eventDate: baby.eventDate ?? undefined,
    birthWeightGrams: baby.birthWeightGrams ?? undefined,
    gestationalWeeks:
      baby.gestationalAgeDays == null
        ? undefined
        : Math.floor(baby.gestationalAgeDays / 7),
    gestationalDays:
      baby.gestationalAgeDays == null ? undefined : baby.gestationalAgeDays % 7,
    bloodType: baby.bloodType ?? undefined,
    feedingType: baby.feedingType ?? undefined,
    riskFactors: baby.riskFactors ?? "",
  };
}

/** Converts a pounds/ounces entry to the nearest whole gram. */
export function poundsOuncesToGrams(pounds: number, ounces: number): number {
  return Math.round((pounds * 16 + ounces) * 28.349523125);
}

/** Converts grams for display and carries a rounded 16.0 ounces into pounds. */
export function gramsToPoundsOunces(grams: number): {
  pounds: number;
  ounces: number;
} {
  const totalOunces = grams / 28.349523125;
  let pounds = Math.floor(totalOunces / 16);
  let ounces = Math.round((totalOunces - pounds * 16) * 10) / 10;
  if (ounces === 16) {
    pounds += 1;
    ounces = 0;
  }
  return { pounds, ounces };
}

export function formatWeight(grams: number): string {
  const { pounds, ounces } = gramsToPoundsOunces(grams);
  return `${grams} g · ${pounds} lb ${ounces.toFixed(1)} oz`;
}

export function formatGestationalAge(totalDays: number): string {
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  return `${weeks} ${weeks === 1 ? "week" : "weeks"}, ${days} ${days === 1 ? "day" : "days"}`;
}

export function getEventDateLabel(
  outcome: BabyRecord["outcome"],
): "Birth date" | "Loss date" | "Event date" {
  if (outcome === "live_birth") return "Birth date";
  if (outcome === "miscarriage" || outcome === "stillbirth") {
    return "Loss date";
  }
  return "Event date";
}

/** Derives calendar age only for a live birth with a recorded event date. */
export function getBabyAgeInDays(
  baby: Pick<BabyRecord, "outcome" | "eventDate">,
  today = new Date(),
): number | null {
  if (baby.outcome !== "live_birth" || !baby.eventDate) return null;
  const [year, month, day] = baby.eventDate.split("-").map(Number);
  const eventDate = Date.UTC(year, month - 1, day);
  const currentDate = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  return Math.max(0, Math.floor((currentDate - eventDate) / 86_400_000));
}

export const babyOutcomeLabels: Record<
  NonNullable<BabyRecord["outcome"]>,
  string
> = {
  live_birth: "Live birth",
  miscarriage: "Miscarriage",
  stillbirth: "Stillbirth",
};

export const feedingTypeLabels: Record<
  NonNullable<BabyRecord["feedingType"]>,
  string
> = {
  breast_milk: "Breast milk",
  formula: "Formula",
  combination: "Combination",
};
