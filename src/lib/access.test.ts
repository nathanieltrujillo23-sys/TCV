import { describe, expect, it } from "vitest";
import { accessFor, type AccessProfile } from "./access";

const base: AccessProfile = { role: "client", accountType: "person", employment: "student", businessTrades: false };

describe("accessFor", () => {
  it("gives a regular individual only the portal", () => {
    expect(accessFor(base)).toEqual({ workspace: false, ledger: false, journal: false, staffTools: false, ownerTools: false });
  });

  it("gives an individual trader the journal but not the ledger", () => {
    const a = accessFor({ ...base, employment: "trader" });
    expect([a.workspace, a.journal, a.ledger]).toEqual([true, true, false]);
  });

  it("gives a business the ledger but not the journal unless it trades", () => {
    const b = accessFor({ ...base, accountType: "business", employment: null });
    expect([b.workspace, b.ledger, b.journal]).toEqual([true, true, false]);
    const trading = accessFor({ ...base, accountType: "business", employment: null, businessTrades: true });
    expect([trading.ledger, trading.journal]).toEqual([true, true]);
  });

  it("ignores businessTrades for individuals and employment for businesses", () => {
    expect(accessFor({ ...base, businessTrades: true }).journal).toBe(false);
    expect(accessFor({ ...base, accountType: "business", employment: "trader" }).journal).toBe(false);
  });

  it("treats an account with no answers as a regular individual", () => {
    expect(accessFor({ role: "client", accountType: null, employment: null, businessTrades: false }).workspace).toBe(false);
  });

  it("gives admins every tool except owner-only ones", () => {
    expect(accessFor({ ...base, role: "admin" })).toEqual({ workspace: true, ledger: true, journal: true, staffTools: true, ownerTools: false });
  });

  it("gives owners everything", () => {
    expect(accessFor({ ...base, role: "owner" })).toEqual({ workspace: true, ledger: true, journal: true, staffTools: true, ownerTools: true });
  });
});
