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

  it("trims required names without normalizing optional text", () => {
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
        middleName: "   ",
        address: "  72 Willow Street  ",
        partnerName: "",
      }),
    });
  });

  it("maps every constrained clinical choice without inventing defaults", () => {
    const result = buildClientInsert(
      validValues({
        bloodType: "AB-",
        rhStatus: "-",
        gbsStatus: "+",
        partnerBloodType: "O+",
      }),
      today,
    );

    expect(result).toEqual({
      success: true,
      data: expect.objectContaining({
        bloodType: "AB-",
        rhStatus: "-",
        gbsStatus: "+",
        partnerBloodType: "O+",
      }),
    });
  });

  it("rejects age alongside a birth date so the two sources cannot conflict", () => {
    const result = buildClientInsert(
      validValues({ dateOfBirth: "1990-03-24", age: 36 }),
      today,
    );

    expect(result).toEqual({
      success: false,
      errors: { age: "Use either date of birth or age, not both." },
    });
  });

  it("rejects a future date of birth", () => {
    const result = buildClientInsert(
      validValues({ dateOfBirth: "2026-07-23" }),
      today,
    );

    expect(result).toEqual({
      success: false,
      errors: { dateOfBirth: "Date of birth cannot be in the future." },
    });
  });

  it("rejects malformed client dates with field-specific errors", () => {
    const result = buildClientInsert(
      validValues({
        dateOfBirth: "not-a-date",
        estimatedDeliveryDate: "2026-02-31",
      }),
      today,
    );

    expect(result).toEqual({
      success: false,
      errors: {
        dateOfBirth: "Enter a valid date.",
        estimatedDeliveryDate: "Enter a valid date.",
      },
    });
  });

  it("rejects non-whole numeric values without enforcing arbitrary ranges", () => {
    const result = buildClientInsert(
      validValues({ age: 0, gravida: 2.5, parity: 100 }),
      today,
    );

    expect(result).toEqual({
      success: false,
      errors: {
        gravida: "Enter a whole number.",
      },
    });
  });

  it("rejects parity greater than gravida while accepting equal values", () => {
    expect(
      buildClientInsert(validValues({ gravida: 2, parity: 3 }), today),
    ).toEqual({
      success: false,
      errors: { parity: "Parity cannot be greater than gravida." },
    });
    expect(
      buildClientInsert(validValues({ gravida: 3, parity: 3 }), today),
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
