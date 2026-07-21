import {
  deriveClientStatus,
  getClientDateSummary,
  isClientVisible,
  matchesClientName,
} from "../client-list";

const names = {
  firstName: "Olivia",
  middleName: "Rose",
  lastName: "Martin",
  preferredName: "Liv",
  partnerName: "Jordan Martin",
};

describe("matchesClientName", () => {
  it("matches normalized client names in either display order", () => {
    expect(matchesClientName(names, "  OLIVIA   ro ")).toBe(true);
    expect(matchesClientName(names, "martin, oliv")).toBe(true);
  });

  it("includes preferred, partner, and future related baby names in one search", () => {
    expect(matchesClientName(names, "liv mar")).toBe(true);
    expect(matchesClientName(names, "jordan mar")).toBe(true);
    expect(matchesClientName(names, "baby june", ["Baby June Martin"])).toBe(
      true,
    );
  });

  it("keeps clients visible for an empty query and excludes unrelated names", () => {
    expect(matchesClientName(names, "   ")).toBe(true);
    expect(matchesClientName(names, "Amina")).toBe(false);
  });
});

describe("deriveClientStatus", () => {
  it("keeps inactive clients out of care even when they have a delivery date", () => {
    expect(
      deriveClientStatus({ isActive: 0, actualDeliveryDate: "2026-07-01" }),
    ).toBe("out-of-care");
  });

  it("distinguishes active prenatal and postpartum clients by delivery date", () => {
    expect(deriveClientStatus({ isActive: 1, actualDeliveryDate: null })).toBe(
      "prenatal",
    );
    expect(
      deriveClientStatus({ isActive: 1, actualDeliveryDate: "2026-07-01" }),
    ).toBe("postpartum");
  });
});

describe("isClientVisible", () => {
  const prenatalOlivia = {
    ...names,
    isActive: 1,
    actualDeliveryDate: null,
  };

  it("requires both the name query and selected status to match", () => {
    expect(isClientVisible(prenatalOlivia, "martin", "prenatal")).toBe(true);
    expect(isClientVisible(prenatalOlivia, "martin", "postpartum")).toBe(false);
    expect(isClientVisible(prenatalOlivia, "amina", "prenatal")).toBe(false);
  });

  it("lets the All Clients filter bypass status without bypassing search", () => {
    expect(isClientVisible(prenatalOlivia, "jordan", "all")).toBe(true);
    expect(isClientVisible(prenatalOlivia, "amina", "all")).toBe(false);
  });
});

describe("getClientDateSummary", () => {
  it("shows an EDD without postpartum metadata before delivery", () => {
    expect(
      getClientDateSummary({
        isActive: 1,
        actualDeliveryDate: null,
        estimatedDeliveryDate: "2026-10-18",
      }),
    ).toEqual({ dateLabel: "EDD: 2026-10-18", postpartumLabel: null });
  });

  it("shows the delivery date and calendar days postpartum after delivery", () => {
    expect(
      getClientDateSummary(
        {
          isActive: 1,
          actualDeliveryDate: "2026-07-20",
          estimatedDeliveryDate: "2026-07-22",
        },
        new Date(2026, 6, 21, 15),
      ),
    ).toEqual({
      dateLabel: "DD: 2026-07-20",
      postpartumLabel: "1 day postpartum",
    });
  });
});
