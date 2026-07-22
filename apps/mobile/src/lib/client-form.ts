import {
  bloodTypes,
  clients,
  deliveryMethods,
  gbsStatuses,
  rhStatuses,
  tearDegrees,
} from "@/db/schema";

export type ClientFormValues = {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  preferredName?: string;
  address?: string;
  primaryPhone?: string;
  dateOfBirth?: string;
  age?: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  gravida?: string;
  parity?: string;
  bloodType?: (typeof bloodTypes)[number];
  rhStatus?: (typeof rhStatuses)[number];
  gbsStatus?: (typeof gbsStatuses)[number];
  deliveryMethod?: (typeof deliveryMethods)[number];
  tearDegree?: (typeof tearDegrees)[number];
  riskFactors?: string;
  partnerName?: string;
  partnerRelationship?: string;
  partnerPhone?: string;
  partnerBloodType?: (typeof bloodTypes)[number];
  isActive: boolean;
};

export type ClientFormErrors = Partial<Record<keyof ClientFormValues, string>>;

export const initialClientFormValues: ClientFormValues = {
  isActive: true,
};

export type ClientFormResult =
  | { success: true; data: typeof clients.$inferInsert }
  | { success: false; errors: ClientFormErrors };

function trimOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function parseInteger(
  value: string | undefined,
  field: "age" | "gravida" | "parity",
  errors: ClientFormErrors,
): number | undefined {
  const normalized = trimOptional(value);
  if (normalized === undefined) return undefined;
  if (!/^\d+$/.test(normalized)) {
    errors[field] = "Enter a whole number.";
    return undefined;
  }

  const parsed = Number(normalized);
  const maximum = field === "age" ? 130 : 99;
  const minimum = field === "age" ? 1 : 0;
  if (parsed < minimum || parsed > maximum) {
    errors[field] = `Enter a number from ${minimum} to ${maximum}.`;
    return undefined;
  }
  return parsed;
}

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

/** Validates form decisions and produces a database-ready client insert without blank nullable values. */
export function buildClientInsert(
  values: ClientFormValues,
  today = new Date(),
): ClientFormResult {
  const errors: ClientFormErrors = {};
  const firstName = trimOptional(values.firstName);
  const lastName = trimOptional(values.lastName);
  if (!firstName) errors.firstName = "First name is required.";
  if (!lastName) errors.lastName = "Last name is required.";

  const age = parseInteger(values.age, "age", errors);
  const gravida = parseInteger(values.gravida, "gravida", errors);
  const parity = parseInteger(values.parity, "parity", errors);

  if (values.dateOfBirth && trimOptional(values.age)) {
    errors.age = "Use either date of birth or age, not both.";
  }
  const todayIso = toIsoDate(today);
  if (values.dateOfBirth && values.dateOfBirth > todayIso) {
    errors.dateOfBirth = "Date of birth cannot be in the future.";
  }
  if (values.actualDeliveryDate && values.actualDeliveryDate > todayIso) {
    errors.actualDeliveryDate = "Delivery date cannot be in the future.";
  }
  if (gravida !== undefined && parity !== undefined && parity > gravida) {
    errors.parity = "Parity cannot be greater than gravida.";
  }

  if (Object.keys(errors).length > 0 || !firstName || !lastName) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      firstName,
      lastName,
      middleName: trimOptional(values.middleName),
      preferredName: trimOptional(values.preferredName),
      address: trimOptional(values.address),
      primaryPhone: trimOptional(values.primaryPhone),
      dateOfBirth: values.dateOfBirth,
      age,
      estimatedDeliveryDate: values.estimatedDeliveryDate,
      actualDeliveryDate: values.actualDeliveryDate,
      gravida,
      parity,
      bloodType: values.bloodType,
      rhStatus: values.rhStatus,
      gbsStatus: values.gbsStatus,
      deliveryMethod: values.deliveryMethod,
      tearDegree: values.tearDegree,
      riskFactors: trimOptional(values.riskFactors),
      partnerName: trimOptional(values.partnerName),
      partnerRelationship: trimOptional(values.partnerRelationship),
      partnerPhone: trimOptional(values.partnerPhone),
      partnerBloodType: values.partnerBloodType,
      isActive: values.isActive ? 1 : 0,
    },
  };
}
