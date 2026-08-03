import type { clients } from "@/db/schema";
import { deriveClientStatus, type ClientStatus } from "@/lib/client-list";

export type ClientRecord = typeof clients.$inferSelect;

export const missingClientValue = "—";

const statusLabels: Record<ClientStatus, string> = {
  prenatal: "Prenatal",
  postpartum: "Postpartum",
  "out-of-care": "Out of Care",
};

/** Returns a display-safe value without using punctuation as a missing sentinel. */
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
  if (client.dateOfBirth) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(client.dateOfBirth);
    if (match) {
      const [, yearValue, monthValue, dayValue] = match;
      const year = Number(yearValue);
      const month = Number(monthValue);
      const day = Number(dayValue);
      const validDate = new Date(year, month - 1, day, 12);
      const isValid =
        validDate.getFullYear() === year &&
        validDate.getMonth() === month - 1 &&
        validDate.getDate() === day;

      if (isValid) {
        let age = today.getFullYear() - year;
        const birthdayHasPassed =
          today.getMonth() + 1 > month ||
          (today.getMonth() + 1 === month && today.getDate() >= day);
        if (!birthdayHasPassed) age -= 1;
        if (age >= 0) return `${age} years (calculated)`;
      }
    }
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
