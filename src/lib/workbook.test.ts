import { describe, expect, it } from "vitest";
import {
  createWorkbook,
  goalPlan,
  monthsUntil,
  parseWorkbook,
  professionalQuestions,
  snapshot,
  totalMonthlyForGoals,
  workbookProgress,
  type WorkbookData,
} from "./workbook";

const TODAY = new Date(2026, 10, 5); // 5 November 2026

function sample(): WorkbookData {
  const w = createWorkbook((k) => k);
  w.income[0].amount = 1800; // take-home
  w.income[1].amount = 400; // part-time
  w.fixed[0].amount = 750; // rent
  w.fixed[1].amount = 50;
  w.variable[0].amount = 300;
  w.variable[1].amount = 150;
  w.occasional[0].amount = 600; // books, per year -> 50/month
  w.cash[0].amount = 1200;
  w.cash[1].amount = 2400;
  w.otherAssets[2].amount = 6000; // car
  w.debts[0].amount = 12000; // federal loans
  w.debts[2].amount = 800; // card
  return w;
}

describe("snapshot", () => {
  it("adds monthly income and expenses, spreading yearly costs over 12 months", () => {
    const s = snapshot(sample());
    expect(s.monthlyIncome).toBe(2200);
    expect(s.monthlyExpenses).toBe(750 + 50 + 300 + 150 + 50);
    expect(s.cashFlow).toBe(2200 - 1300);
  });

  it("computes net worth and months of expenses covered by cash", () => {
    const s = snapshot(sample());
    expect(s.cash).toBe(3600);
    expect(s.totalAssets).toBe(9600);
    expect(s.totalDebts).toBe(12800);
    expect(s.netWorth).toBe(-3200);
    expect(s.monthsCovered).toBe(2.8); // 3600 / 1300 = 2.77
  });

  it("leaves months covered empty until there are expenses", () => {
    expect(snapshot(createWorkbook((k) => k)).monthsCovered).toBeNull();
  });
});

describe("monthsUntil", () => {
  it("counts whole months from this month", () => {
    expect(monthsUntil("2026-12", TODAY)).toBe(1);
    expect(monthsUntil("2027-11", TODAY)).toBe(12);
    expect(monthsUntil("2026-11", TODAY)).toBe(0);
    expect(monthsUntil("2026-06", TODAY)).toBe(-5);
  });

  it("rejects malformed dates", () => {
    expect(monthsUntil("", TODAY)).toBeNull();
    expect(monthsUntil("2027-13", TODAY)).toBeNull();
    expect(monthsUntil("next year", TODAY)).toBeNull();
  });
});

describe("goalPlan", () => {
  const base = { id: "g", name: "Emergency fund", target: 3000, saved: 600, date: "2027-11" };

  it("splits what is left evenly over the months, with no growth assumed", () => {
    expect(goalPlan(base, TODAY)).toEqual({ status: "onTrack", months: 12, monthlyNeeded: 200 });
  });

  it("marks reached goals and goals whose date has passed", () => {
    expect(goalPlan({ ...base, saved: 3000 }, TODAY).status).toBe("reached");
    expect(goalPlan({ ...base, date: "2026-11" }, TODAY).status).toBe("pastDate");
  });

  it("waits for a name, a positive target and a date", () => {
    expect(goalPlan({ ...base, name: " " }, TODAY).status).toBe("incomplete");
    expect(goalPlan({ ...base, target: null }, TODAY).status).toBe("incomplete");
    expect(goalPlan({ ...base, date: "" }, TODAY).status).toBe("incomplete");
  });

  it("totals the monthly saving across goals", () => {
    const goals = [base, { ...base, id: "h", target: 1200, saved: 0, date: "2027-05" }];
    expect(totalMonthlyForGoals(goals, TODAY)).toBe(400);
  });
});

describe("professionalQuestions", () => {
  it("asks about every visible item answered Not sure, in checklist order", () => {
    const w = sample();
    w.checklist = { creditScore: "not_sure", budget: "yes", taxes: "not_sure", hidden: "not_sure" };
    expect(professionalQuestions(w, ["budget", "creditScore", "taxes"], TODAY)).toEqual(["creditScore", "taxes"]);
  });

  it("adds questions that come from the numbers", () => {
    const w = sample();
    w.income[0].amount = 500; // now spending more than earning
    w.goals[0] = { id: "g", name: "Trip", target: 2400, saved: 0, date: "2027-11" };
    expect(professionalQuestions(w, [], TODAY)).toEqual(["negativeCashFlow", "goalsExceedCashFlow", "debtVsGoals"]);
  });

  it("stays quiet when goals fit inside cash flow and there is no debt", () => {
    const w = sample();
    w.debts.forEach((d) => (d.amount = null));
    w.goals[0] = { id: "g", name: "Trip", target: 2400, saved: 0, date: "2027-11" };
    expect(professionalQuestions(w, [], TODAY)).toEqual([]);
  });
});

describe("workbookProgress", () => {
  it("counts snapshot, goals and checklist", () => {
    const w = sample();
    expect(workbookProgress(w, ["budget"], TODAY)).toMatchObject({ snapshot: true, goals: false, checklist: false, done: 1 });
    w.goals[0] = { id: "g", name: "Trip", target: 2400, saved: 0, date: "2027-11" };
    w.checklist = { budget: "not_yet" };
    expect(workbookProgress(w, ["budget"], TODAY)).toMatchObject({ done: 3, total: 3 });
  });
});

describe("parseWorkbook", () => {
  it("round trips a saved workbook", () => {
    const w = sample();
    expect(parseWorkbook(JSON.parse(JSON.stringify(w)))).toEqual(w);
  });

  it("rejects other shapes and drops bad values", () => {
    expect(parseWorkbook(null)).toBeNull();
    expect(parseWorkbook({ version: 2 })).toBeNull();
    const parsed = parseWorkbook({ version: 1, stage: "astronaut", income: [{ id: "a", label: "x", amount: "lots" }], checklist: { budget: "maybe", taxes: "yes" } });
    expect(parsed?.stage).toBeNull();
    expect(parsed?.income[0].amount).toBeNull();
    expect(parsed?.checklist).toEqual({ taxes: "yes" });
    expect(parsed?.goals).toHaveLength(1);
  });
});
