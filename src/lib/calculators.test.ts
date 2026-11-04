import { describe, expect, it } from "vitest";
import { compoundGrowth, debtPayoff, retirementProjection, savingsGoal } from "./calculators";

describe("compoundGrowth", () => {
  it("matches the closed form FV = P(1+i)^m + C((1+i)^m - 1)/i", () => {
    const i = 0.06 / 12;
    const m = 120;
    const expected = 1000 * Math.pow(1 + i, m) + (100 * (Math.pow(1 + i, m) - 1)) / i;
    const r = compoundGrowth(1000, 100, 6, 10);
    expect(r.finalBalance).toBeCloseTo(expected, 1);
    expect(r.totalContributed).toBe(13000); // 1,000 + 100 x 120
    expect(r.totalGrowth).toBeCloseTo(expected - 13000, 1);
    expect(r.years).toHaveLength(10);
  });

  it("with no return, the balance is just what you put in", () => {
    const r = compoundGrowth(500, 50, 0, 2);
    expect(r.finalBalance).toBe(1700);
    expect(r.totalGrowth).toBe(0);
  });
});

describe("savingsGoal", () => {
  it("at 0%, splits the gap evenly", () => {
    expect(savingsGoal(12000, 0, 24, 0).monthlyNeeded).toBe(500);
  });

  it("with interest, the deposit grows back to exactly the goal", () => {
    const { monthlyNeeded } = savingsGoal(10000, 1000, 36, 4);
    expect(compoundGrowth(1000, monthlyNeeded, 4, 3).finalBalance).toBeCloseTo(10000, 0);
  });

  it("needs nothing when current savings already get there", () => {
    expect(savingsGoal(1000, 2000, 12, 3).monthlyNeeded).toBe(0);
  });
});

describe("debtPayoff", () => {
  it("$1,000 at 0% with $100 a month takes 10 months and no interest", () => {
    expect(debtPayoff(1000, 0, 100)).toMatchObject({ months: 10, totalInterest: 0, totalPaid: 1000 });
  });

  it("$5,000 at 18% APR with $200 a month", () => {
    // Standard amortization: n = -ln(1 - iB/P) / ln(1 + i) = 31.9, so 32 payments
    const r = debtPayoff(5000, 18, 200);
    expect(r.months).toBe(32);
    expect(r.totalPaid).toBeCloseTo(5000 + (r.totalInterest as number), 2);
    expect(r.totalInterest).toBeGreaterThan(1300);
    expect(r.totalInterest).toBeLessThan(1400);
  });

  it("flags a payment that never covers the interest", () => {
    const r = debtPayoff(10000, 24, 150); // $200 interest the first month
    expect(r.months).toBeNull();
    expect(r.firstMonthInterest).toBe(200);
  });
});

describe("retirementProjection", () => {
  const base = { salary: 50000, contributionPct: 6, matchRatePct: 50, matchCapPct: 6, currentBalance: 0, years: 1, annualReturnPct: 0, salaryGrowthPct: 0 };

  it("first year: 6% of $50,000 = $3,000, plus a 50% match = $1,500", () => {
    const r = retirementProjection(base);
    expect([r.totalYours, r.totalMatch, r.finalBalance]).toEqual([3000, 1500, 4500]);
  });

  it("the match stops at the cap", () => {
    expect(retirementProjection({ ...base, contributionPct: 10 }).totalMatch).toBe(1500); // still 50% of 6%
  });

  it("growth and raises compound year by year", () => {
    const r = retirementProjection({ ...base, years: 2, annualReturnPct: 10, salaryGrowthPct: 10 });
    // Year 1: 0 x 1.1 + 4,500 = 4,500. Year 2: 4,500 x 1.1 + (3,300 + 1,650) = 9,900
    expect(r.years.map((y) => y.balance)).toEqual([4500, 9900]);
    expect(r.totalGrowth).toBe(450);
  });
});
