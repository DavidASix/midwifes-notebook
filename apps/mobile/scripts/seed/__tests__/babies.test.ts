import { babiesSchema } from "../../../src/db/schema";
import { createBabySeedData } from "../babies";

describe("createBabySeedData", () => {
  const clientIds = [1, 2, 3, 4, 5, 6, 7, 8];

  it("creates zero to three reproducible records for every client scope", () => {
    const firstRun = createBabySeedData(clientIds);
    const secondRun = createBabySeedData(clientIds);
    const counts = clientIds.map(
      (clientId) =>
        firstRun.filter((baby) => baby.clientId === clientId).length,
    );

    expect(secondRun).toEqual(firstRun);
    expect(firstRun.length).toBeGreaterThan(0);
    expect(counts).toEqual([3, 0, 3, 3, 3, 2, 0, 2]);
    for (const count of counts) {
      expect(count).toBeGreaterThanOrEqual(0);
      expect(count).toBeLessThanOrEqual(3);
    }
  });

  it("only creates rows accepted by the persisted baby schema", () => {
    const rows = createBabySeedData(clientIds);
    const timestamp = "2026-09-17T12:00:00.000Z";

    for (const [index, row] of rows.entries()) {
      expect(
        babiesSchema.safeParse({
          ...row,
          id: index + 1,
          createdAt: timestamp,
          updatedAt: timestamp,
          deletedAt: null,
        }).success,
      ).toBe(true);
    }
  });

  it("keeps loss records free of live-birth-only feeding details", () => {
    const lossRecords = createBabySeedData(clientIds).filter(
      (baby) => baby.outcome !== "live_birth",
    );

    expect(lossRecords.length).toBeGreaterThan(0);
    expect(lossRecords.every((baby) => baby.feedingType === null)).toBe(true);
  });
});
