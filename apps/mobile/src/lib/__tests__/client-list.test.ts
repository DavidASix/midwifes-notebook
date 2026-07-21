import { deriveClientStatus, getClientDateSummary } from "../client-list";

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
