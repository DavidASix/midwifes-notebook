import type { BabyRecord } from "@/db/schema";
import {
  babyToFormValues,
  buildBabyInsert,
  buildBabyUpdate,
} from "@/lib/baby-form";
import { gramsToPoundsOunces, poundsOuncesToGrams } from "@/lib/weight";
import { getBabyAgeInDays, getEventDateLabel } from "@/lib/baby-record";

function makeBaby(overrides: Partial<BabyRecord> = {}): BabyRecord {
  return {
    id: 1,
    clientId: 2,
    name: null,
    sex: null,
    eventDate: null,
    birthWeightGrams: null,
    gestationalAgeDays: null,
    bloodType: null,
    feedingType: null,
    riskFactors: null,
    outcome: null,
    createdAt: "2026-09-16T20:00:00.000Z",
    updatedAt: "2026-09-16T20:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}

describe("baby record persistence", () => {
  it("accepts a completely blank record and normalizes every optional value to null", () => {
    expect(
      buildBabyInsert(2, {
        name: "   ",
        riskFactors: " ",
      }),
    ).toEqual({
      success: true,
      data: {
        clientId: 2,
        name: null,
        sex: null,
        outcome: null,
        eventDate: null,
        birthWeightGrams: null,
        gestationalAgeDays: null,
        bloodType: null,
        feedingType: null,
        riskFactors: null,
      },
    });
  });

  it("stores gestational weeks and days as one non-negative whole-day value", () => {
    const result = buildBabyUpdate({
      gestationalWeeks: 39,
      gestationalDays: 6,
    });
    expect(result).toMatchObject({
      success: true,
      data: { gestationalAgeDays: 279 },
    });
  });

  it("rejects negative numbers, out-of-range gestational days, and invalid enums", () => {
    const result = buildBabyUpdate({
      birthWeightGrams: -1,
      gestationalWeeks: -1,
      gestationalDays: 7,
      outcome: "delivery" as never,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toMatchObject({
        birthWeightGrams: expect.any(String),
        gestationalWeeks: expect.any(String),
        gestationalDays: expect.any(String),
        outcome: expect.any(String),
      });
    }
  });

  it("rejects a structurally valid future event date", () => {
    const result = buildBabyUpdate({ eventDate: "2999-01-01" });
    expect(result).toEqual({
      success: false,
      errors: { eventDate: expect.any(String) },
    });
  });

  it("maps total gestational days back to editable weeks and days", () => {
    expect(
      babyToFormValues(makeBaby({ gestationalAgeDays: 276 })),
    ).toMatchObject({ gestationalWeeks: 39, gestationalDays: 3 });
  });
});

describe("baby display conversions", () => {
  it("rounds imperial entry to whole grams and converts back to tenths of an ounce", () => {
    expect(poundsOuncesToGrams(7, 8)).toBe(3402);
    expect(gramsToPoundsOunces(3402)).toEqual({ pounds: 7, ounces: 8 });
  });

  it("carries a displayed 16.0 ounces into the next pound", () => {
    expect(gramsToPoundsOunces(453)).toEqual({ pounds: 1, ounces: 0 });
  });

  it("uses outcome-sensitive date labels", () => {
    expect(getEventDateLabel("live_birth")).toBe("Birth date");
    expect(getEventDateLabel("miscarriage")).toBe("Loss date");
    expect(getEventDateLabel("stillbirth")).toBe("Loss date");
    expect(getEventDateLabel(null)).toBe("Event date");
  });

  it("derives calendar days only for live births", () => {
    const today = new Date(2026, 8, 17, 18);
    expect(
      getBabyAgeInDays(
        makeBaby({ outcome: "live_birth", eventDate: "2026-09-15" }),
        today,
      ),
    ).toBe(2);
    expect(
      getBabyAgeInDays(
        makeBaby({ outcome: "miscarriage", eventDate: "2026-09-15" }),
        today,
      ),
    ).toBeNull();
    expect(
      getBabyAgeInDays(
        makeBaby({ outcome: null, eventDate: "2026-09-15" }),
        today,
      ),
    ).toBeNull();
  });
});
