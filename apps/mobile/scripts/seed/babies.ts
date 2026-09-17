import { faker } from "@faker-js/faker/locale/en_CA";

import {
  babies,
  babySexes,
  bloodTypes,
  feedingTypes,
  type BabyRecord,
} from "../../src/db/schema";
import { toIsoDate } from "../../src/lib/dates";

import type { SeedDatabase } from ".";

const BABY_SEED = 20_260_917;
const EARLIEST_EVENT_DATE = new Date(2015, 0, 1, 12);
const LATEST_EVENT_DATE = new Date(2026, 8, 1, 12);

type BabyOutcome = NonNullable<BabyRecord["outcome"]>;

function optional<T>(value: T, probability = 0.75): T | null {
  return faker.number.float({ min: 0, max: 1 }) < probability ? value : null;
}

function createOutcome(): BabyOutcome {
  const roll = faker.number.int({ min: 1, max: 10 });
  if (roll <= 7) return "live_birth";
  if (roll <= 9) return "miscarriage";
  return "stillbirth";
}

/** Builds deterministic fictional baby records for development database resets. */
export function createBabySeedData(
  clientIds: readonly number[],
): (typeof babies.$inferInsert)[] {
  faker.seed(BABY_SEED);

  return clientIds.flatMap((clientId) => {
    const recordCount = faker.number.int({ min: 0, max: 3 });
    return Array.from({ length: recordCount }, () => {
      const outcome = createOutcome();
      const sex = faker.helpers.arrayElement(babySexes);
      const isLiveBirth = outcome === "live_birth";
      const isMiscarriage = outcome === "miscarriage";

      return {
        clientId,
        name:
          isMiscarriage || faker.number.float({ min: 0, max: 1 }) >= 0.85
            ? null
            : faker.person.firstName(sex === "unknown" ? undefined : sex),
        sex: isMiscarriage ? "unknown" : sex,
        eventDate: toIsoDate(
          faker.date.between({
            from: EARLIEST_EVENT_DATE,
            to: LATEST_EVENT_DATE,
          }),
        ),
        birthWeightGrams: isMiscarriage
          ? null
          : faker.number.int({ min: 500, max: 4_500 }),
        gestationalAgeDays: faker.number.int(
          isMiscarriage ? { min: 42, max: 139 } : { min: 140, max: 294 },
        ),
        bloodType: isLiveBirth
          ? optional(faker.helpers.arrayElement(bloodTypes), 0.6)
          : null,
        feedingType: isLiveBirth
          ? optional(faker.helpers.arrayElement(feedingTypes), 0.8)
          : null,
        riskFactors: optional(
          faker.helpers.arrayElement([
            "Breech presentation",
            "Low birth weight",
            "Monitoring bilirubin",
            "Preterm labour",
          ]),
          0.3,
        ),
        outcome,
      } satisfies typeof babies.$inferInsert;
    });
  });
}

/** Inserts zero to three deterministic fictional baby records per client. */
export async function seedBabies(
  db: SeedDatabase,
  clientIds: readonly number[],
): Promise<void> {
  const babySeedData = createBabySeedData(clientIds);
  if (babySeedData.length > 0) {
    await db.insert(babies).values(babySeedData);
  }
}
