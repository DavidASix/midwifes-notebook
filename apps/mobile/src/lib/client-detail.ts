import { isoCalendarDateSchema, type ClientRecord } from "@/db/schema";
import { deriveClientStatus, type ClientStatus } from "@/lib/client-list";

export type { ClientRecord } from "@/db/schema";

export const missingClientValue = "—";

const statusLabels: Record<ClientStatus, string> = {
  prenatal: "Prenatal",
  postpartum: "Postpartum",
  "out-of-care": "Out of Care",
};

/** Returns a display-safe value using the shared missing-value sentinel. */
export function formatClientDetailValue(
  value: string | number | null | undefined,
): string {
  if (value == null || (typeof value === "string" && !value.trim())) {
    return missingClientValue;
  }
  return String(value);
}

/** Calculates completed calendar years from an ISO date, or uses recorded age when no valid birth date exists. */
export function formatClientAge(
  client: Pick<ClientRecord, "dateOfBirth" | "age">,
  today = new Date(),
): string {
  const parsedDate = isoCalendarDateSchema.safeParse(client.dateOfBirth);
  if (parsedDate.success) {
    const [year, month, day] = parsedDate.data.split("-").map(Number);
    let age = today.getFullYear() - year;
    const birthdayHasPassed =
      today.getMonth() + 1 > month ||
      (today.getMonth() + 1 === month && today.getDate() >= day);
    if (!birthdayHasPassed) age -= 1;
    if (age >= 0) return `${age} years (calculated)`;
  }

  return client.age == null
    ? missingClientValue
    : `${client.age} years (recorded)`;
}

export function getClientFullName(
  client: Pick<ClientRecord, "firstName" | "middleName" | "lastName">,
): string {
  return [client.firstName, client.middleName, client.lastName]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(" ");
}

export function formatClientStatus(
  client: Pick<ClientRecord, "isActive" | "actualDeliveryDate">,
): string {
  return statusLabels[deriveClientStatus(client)];
}

export function formatClinicalSign(value: "+" | "-" | null): string {
  if (value === "+") return "Positive";
  if (value === "-") return "Negative";
  return missingClientValue;
}
