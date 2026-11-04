import { describe, expect, it } from "vitest";
import { translate } from "./translate";
import { en } from "./en";

describe("translate", () => {
  it("returns the English string for a key", () => {
    expect(translate(en, "common.signIn")).toBe("Sign in");
  });

  it("fills {placeholders}", () => {
    expect(translate(en, "site.footer.copyright", { year: 2026 })).toContain("© 2026 TruCapitalVentures LLC");
  });

  it("falls back to the key when a string is missing", () => {
    expect(translate({}, "missing.key")).toBe("missing.key");
  });
});
