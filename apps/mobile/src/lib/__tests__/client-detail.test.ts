import {
  formatClientAge,
  formatClientDetailValue,
  formatClinicalSign,
  missingClientValue,
} from "@/lib/client-detail";

describe("client detail decisions", () => {
  it("calculates completed years and identifies the source of the displayed age", () => {
    const today = new Date(2026, 7, 2, 12);

    expect(formatClientAge({ dateOfBirth: "1990-08-02", age: 99 }, today)).toBe(
      "36 years (calculated)",
    );
    expect(
      formatClientAge({ dateOfBirth: "1990-08-03", age: null }, today),
    ).toBe("35 years (calculated)");
    expect(formatClientAge({ dateOfBirth: null, age: 41 }, today)).toBe(
      "41 years (recorded)",
    );
  });

  it("uses explicit language for absent and negative clinical values", () => {
    expect(formatClientDetailValue(null)).toBe(missingClientValue);
    expect(formatClientDetailValue("   ")).toBe(missingClientValue);
    expect(formatClinicalSign(null)).toBe(missingClientValue);
    expect(formatClinicalSign("-")).toBe("Negative");
    expect(formatClinicalSign("+")).toBe("Positive");
  });
});
