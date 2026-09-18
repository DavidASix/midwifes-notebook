import type { BabyRecord } from "@/db/schema";

const revisions = new Map<number, number>();

/** Returns the current change revision for one client's baby records. */
export function getBabyRecordsRevision(clientId: number): number {
  return revisions.get(clientId) ?? 0;
}

/** Marks one client's baby records stale after a successful mutation. */
export function markBabyRecordsChanged(clientId: number): void {
  revisions.set(clientId, getBabyRecordsRevision(clientId) + 1);
}

/** Displays stored total gestational days as whole weeks and remaining days. */
export function formatGestationalAge(totalDays: number): string {
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  return `${weeks} ${weeks === 1 ? "week" : "weeks"}, ${days} ${days === 1 ? "day" : "days"}`;
}

/** Chooses birth, loss, or neutral date copy from the recorded outcome. */
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
