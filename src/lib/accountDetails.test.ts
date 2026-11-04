import { describe, expect, it } from "vitest";
import { accountDetailsError } from "./accountDetails";

describe("accountDetailsError", () => {
  it("requires choosing individual or business", () => {
    expect(accountDetailsError({ accountType: null, employment: null, businessTrades: false })).toBe("account.error.type");
  });
  it("requires employment for individuals", () => {
    expect(accountDetailsError({ accountType: "person", employment: null, businessTrades: false })).toBe("account.error.employment");
    expect(accountDetailsError({ accountType: "person", employment: "trader", businessTrades: false })).toBeNull();
  });
  it("does not require employment for businesses", () => {
    expect(accountDetailsError({ accountType: "business", employment: null, businessTrades: true })).toBeNull();
  });
});
