import {
  buildClientInsert,
  fromIsoDate,
  toIsoDate,
  type ClientFormValues,
} from "../client-form";

const today = new Date(2026, 6, 22, 12);

function validValues(
  overrides: Partial<ClientFormValues> = {},
): ClientFormValues {
  return {
    firstName: "Amina",
    lastName: "Yusuf",
    isActive: true,
    ...overrides,
  };
}

describe("buildClientInsert", () => {
  it("rejects a record without both required names", () => {
    const result = buildClientInsert(
      validValues({ firstName: " ", lastName: undefined }),
      today,
    );

    expect(result).toEqual({
      success: false,
      errors: {
        firstName: "First name is required.",
        lastName: "Last name is required.",
      },
    });
  });

  it("trims entered text and preserves blank nullable fields as undefined", () => {
    const result = buildClientInsert(
      validValues({
        firstName: "  Amina ",
        lastName: " Yusuf  ",
        middleName: "   ",
        address: "  72 Willow Street  ",
        partnerName: "",
      }),
      today,
    );

    expect(result).toEqual({
      success: true,
      data: expect.objectContaining({
        firstName: "Amina",
        lastName: "Yusuf",
        middleName: undefined,
        address: "72 Willow Street",
        partnerName: undefined,
        isActive: 1,
      }),
    });
  });

  it("maps every constrained clinical choice without inventing defaults", () => {
    const result = buildClientInsert(
      validValues({
        bloodType: "AB-",
        rhStatus: "-",
        gbsStatus: "+",
        deliveryMethod: "C-Section",
        tearDegree: 3,
        partnerBloodType: "O+",
        isActive: false,
      }),
      today,
    );

    expect(result).toEqual({
      success: true,
      data: expect.objectContaining({
        bloodType: "AB-",
        rhStatus: "-",
        gbsStatus: "+",
        deliveryMethod: "C-Section",
        tearDegree: 3,
        partnerBloodType: "O+",
        isActive: 0,
      }),
    });
  });

  it("rejects age alongside a birth date so the two sources cannot conflict", () => {
    const result = buildClientInsert(
      validValues({ dateOfBirth: "1990-03-24", age: "36" }),
      today,
    );

    expect(result).toEqual({
      success: false,
      errors: { age: "Use either date of birth or age, not both." },
    });
  });

  it("rejects future dates that would create impossible history", () => {
    const result = buildClientInsert(
      validValues({
        dateOfBirth: "2026-07-23",
        actualDeliveryDate: "2026-08-01",
      }),
      today,
    );

    expect(result).toEqual({
      success: false,
      errors: {
        dateOfBirth: "Date of birth cannot be in the future.",
        actualDeliveryDate: "Delivery date cannot be in the future.",
      },
    });
  });

  it("rejects non-whole and out-of-range numeric values", () => {
    const result = buildClientInsert(
      validValues({ age: "0", gravida: "2.5", parity: "100" }),
      today,
    );

    expect(result).toEqual({
      success: false,
      errors: {
        age: "Enter a number from 1 to 130.",
        gravida: "Enter a whole number.",
        parity: "Enter a number from 0 to 99.",
      },
    });
  });

  it("rejects parity greater than gravida while accepting equal values", () => {
    expect(
      buildClientInsert(validValues({ gravida: "2", parity: "3" }), today),
    ).toEqual({
      success: false,
      errors: { parity: "Parity cannot be greater than gravida." },
    });
    expect(
      buildClientInsert(validValues({ gravida: "3", parity: "3" }), today),
    ).toEqual({
      success: true,
      data: expect.objectContaining({ gravida: 3, parity: 3 }),
    });
  });
});

describe("calendar date conversion", () => {
  it("round-trips a local calendar date without crossing a UTC boundary", () => {
    const localDate = fromIsoDate("2026-03-08");
    expect(localDate.getHours()).toBe(12);
    expect(toIsoDate(localDate)).toBe("2026-03-08");
  });
});
