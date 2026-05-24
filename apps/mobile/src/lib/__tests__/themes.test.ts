import { themes } from "../themes";

describe("themes", () => {
  it("no theme token is undefined", () => {
    for (const value of Object.values(themes.light))
      expect(value).toBeDefined();
    for (const value of Object.values(themes.dark)) expect(value).toBeDefined();
  });
});
