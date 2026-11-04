import { round } from "./instruments";

// Deterministic education calculators. Rates are annual percentages (7 means 7%).
// Results are illustrations under fixed assumptions, never predictions.

export interface GrowthYear {
  year: number;
  contributed: number;
  balance: number;
}

export interface CompoundGrowthResult {
  finalBalance: number;
  totalContributed: number;
  totalGrowth: number;
  years: GrowthYear[];
}

/**
 * Monthly compounding with deposits at the end of each month:
 * FV = P(1+i)^m + C((1+i)^m - 1)/i, where i = rate/12 and m = 12 x years.
 */
export function compoundGrowth(initial: number, monthly: number, annualRatePct: number, years: number): CompoundGrowthResult {
  const i = annualRatePct / 100 / 12;
  const rows: GrowthYear[] = [];
  let balance = initial;
  let contributed = initial;
  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + i) + monthly;
      contributed += monthly;
    }
    rows.push({ year: y, contributed: round(contributed, 2), balance: round(balance, 2) });
  }
  const finalBalance = round(balance, 2);
  return { finalBalance, totalContributed: round(contributed, 2), totalGrowth: round(finalBalance - contributed, 2), years: rows };
}

export interface SavingsGoalResult {
  /** Monthly deposit needed, 0 when current savings already grow to the goal. */
  monthlyNeeded: number;
  /** What the current savings alone grow to by the deadline. */
  currentGrowsTo: number;
}

/** Monthly deposit that reaches a goal: (goal - S(1+i)^m) x i / ((1+i)^m - 1), or a straight split at 0%. */
export function savingsGoal(goal: number, current: number, months: number, annualRatePct: number): SavingsGoalResult {
  const i = annualRatePct / 100 / 12;
  const factor = Math.pow(1 + i, months);
  const currentGrowsTo = current * factor;
  const gap = goal - currentGrowsTo;
  if (gap <= 0 || months <= 0) return { monthlyNeeded: 0, currentGrowsTo: round(currentGrowsTo, 2) };
  const monthlyNeeded = i === 0 ? gap / months : (gap * i) / (factor - 1);
  return { monthlyNeeded: round(monthlyNeeded, 2), currentGrowsTo: round(currentGrowsTo, 2) };
}

export interface DebtPayoffResult {
  /** Null when the payment never covers the monthly interest. */
  months: number | null;
  totalInterest: number | null;
  totalPaid: number | null;
  /** Interest charged in the first month; the payment must be larger than this. */
  firstMonthInterest: number;
}

const MAX_MONTHS = 1200;

/** Month by month: add interest at APR/12, subtract the payment, with a smaller final payment. */
export function debtPayoff(balance: number, aprPct: number, payment: number): DebtPayoffResult {
  const i = aprPct / 100 / 12;
  const firstMonthInterest = round(balance * i, 2);
  if (balance <= 0) return { months: 0, totalInterest: 0, totalPaid: 0, firstMonthInterest: 0 };
  if (payment <= balance * i) return { months: null, totalInterest: null, totalPaid: null, firstMonthInterest };
  let remaining = balance;
  let interestPaid = 0;
  let paid = 0;
  let months = 0;
  while (remaining > 0.005 && months < MAX_MONTHS) {
    const interest = round(remaining * i, 2);
    interestPaid += interest;
    const due = remaining + interest;
    const pay = Math.min(payment, due);
    paid += pay;
    remaining = round(due - pay, 2);
    months++;
  }
  return { months, totalInterest: round(interestPaid, 2), totalPaid: round(paid, 2), firstMonthInterest };
}

export interface RetirementInput {
  salary: number;
  contributionPct: number;
  /** Employer adds this share of what you put in (50 means 50 cents per dollar). */
  matchRatePct: number;
  /** ...on contributions up to this share of salary. */
  matchCapPct: number;
  currentBalance: number;
  years: number;
  annualReturnPct: number;
  salaryGrowthPct: number;
}

export interface RetirementYear {
  year: number;
  yourContribution: number;
  employerMatch: number;
  balance: number;
}

export interface RetirementResult {
  finalBalance: number;
  totalYours: number;
  totalMatch: number;
  totalGrowth: number;
  years: RetirementYear[];
}

/**
 * Yearly: balance grows by the return, then this year's contributions are added
 * (a simple year-end approximation). The match applies to contributions up to the
 * cap. Ignores taxes, fees, and annual IRS limits, which the lesson explains.
 */
export function retirementProjection(p: RetirementInput): RetirementResult {
  let salary = p.salary;
  let balance = p.currentBalance;
  let totalYours = 0;
  let totalMatch = 0;
  const rows: RetirementYear[] = [];
  for (let y = 1; y <= p.years; y++) {
    const yours = salary * (p.contributionPct / 100);
    const match = salary * (Math.min(p.contributionPct, p.matchCapPct) / 100) * (p.matchRatePct / 100);
    balance = balance * (1 + p.annualReturnPct / 100) + yours + match;
    totalYours += yours;
    totalMatch += match;
    rows.push({ year: y, yourContribution: round(yours, 2), employerMatch: round(match, 2), balance: round(balance, 2) });
    salary *= 1 + p.salaryGrowthPct / 100;
  }
  const finalBalance = round(balance, 2);
  return {
    finalBalance,
    totalYours: round(totalYours, 2),
    totalMatch: round(totalMatch, 2),
    totalGrowth: round(finalBalance - p.currentBalance - totalYours - totalMatch, 2),
    years: rows,
  };
}
