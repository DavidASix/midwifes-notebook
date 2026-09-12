import { parsePositiveIntegerRouteParam } from "../route-params";

describe("parsePositiveIntegerRouteParam", () => {
  it("rejects malformed route IDs before they can reach data access", () => {
    expect(parsePositiveIntegerRouteParam(undefined)).toBeNull();
    expect(parsePositiveIntegerRouteParam(["1", "2"])).toBeNull();
    expect(parsePositiveIntegerRouteParam("")).toBeNull();
    expect(parsePositiveIntegerRouteParam("0")).toBeNull();
    expect(parsePositiveIntegerRouteParam("-1")).toBeNull();
    expect(parsePositiveIntegerRouteParam("1.5")).toBeNull();
    expect(parsePositiveIntegerRouteParam("4e1")).toBeNull();
    expect(parsePositiveIntegerRouteParam("0x28")).toBeNull();
    expect(parsePositiveIntegerRouteParam(" 40 ")).toBeNull();
    expect(parsePositiveIntegerRouteParam("040")).toBeNull();
    expect(parsePositiveIntegerRouteParam("12x")).toBeNull();
    expect(parsePositiveIntegerRouteParam("9007199254740992")).toBeNull();
  });

  it("returns a canonical positive-integer route ID", () => {
    expect(parsePositiveIntegerRouteParam("42")).toBe(42);
  });
});
