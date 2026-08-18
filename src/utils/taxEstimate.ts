import type { Transaction } from "../types";
import { transactionTotal } from "./format";

// Simplified federal tax-planning estimate for a single filer running a
// single-member LLC taxed as a sole proprietorship (Schedule C), plus any
// separate W-2/work income. This is NOT tax advice — it ignores state taxes,
// tax credits, itemized deductions, retirement contributions, and several
// QBI/tip-deduction edge cases (SSTB status, W-2 wage/UBIA limits). Figures
// are 2026 tax year, single filing status, sourced from IRS Rev. Proc.
// 2025-32 and the One Big Beautiful Bill Act (OBBBA, signed July 4, 2025).
export const TAX_YEAR = 2026;

const STANDARD_DEDUCTION_SINGLE = 16_100;

// IRS Rev. Proc. 2025-32, single filer.
const BRACKETS_SINGLE: { upTo: number; rate: number }[] = [
  { upTo: 12_400, rate: 0.1 },
  { upTo: 50_400, rate: 0.12 },
  { upTo: 105_700, rate: 0.22 },
  { upTo: 201_775, rate: 0.24 },
  { upTo: 256_225, rate: 0.32 },
  { upTo: 640_600, rate: 0.35 },
  { upTo: Infinity, rate: 0.37 },
];

// Self-employment tax (Schedule SE).
const SS_WAGE_BASE = 184_500;
const SE_TAX_RATE_SS = 0.124;
const SE_TAX_RATE_MEDICARE = 0.029;
const ADDITIONAL_MEDICARE_RATE = 0.009;
const ADDITIONAL_MEDICARE_THRESHOLD_SINGLE = 200_000;
const SE_NET_EARNINGS_FACTOR = 0.9235;

// Qualified Business Income deduction (Section 199A), made permanent by
// OBBBA. Full 20% below the phase-in floor; this estimate assumes a
// non-SSTB business and doesn't model the W-2-wage/UBIA limitation that
// applies above the floor, so treat amounts near/above the threshold as
// a rough floor, not a precise number.
const QBI_RATE = 0.2;
const QBI_PHASE_IN_START_SINGLE = 201_750;
const QBI_PHASE_IN_RANGE_SINGLE = 75_000;

// OBBBA "no tax on tips" (new IRC §224), 2025–2028 only.
const TIPS_DEDUCTION_CAP = 25_000;
const TIPS_PHASEOUT_START_SINGLE = 150_000;
const TIPS_PHASEOUT_PER_1000 = 100;

export interface TaxEstimateInput {
  llcNetProfit: number;
  workIncome: number;
  federalWithheld: number;
  tips: number;
  scholarshipRefund: number;
}

export interface TaxEstimateResult {
  seTax: number;
  halfSeTaxDeduction: number;
  tipsDeduction: number;
  qbiDeduction: number;
  standardDeduction: number;
  totalIncome: number;
  agi: number;
  taxableIncome: number;
  federalIncomeTax: number;
  totalTaxLiability: number;
  effectiveRate: number;
  balanceDue: number; // positive = estimated amount owed, negative = estimated refund
}

function progressiveTax(taxableIncome: number): number {
  let tax = 0;
  let lower = 0;
  for (const bracket of BRACKETS_SINGLE) {
    if (taxableIncome <= lower) break;
    const upper = Math.min(taxableIncome, bracket.upTo);
    tax += (upper - lower) * bracket.rate;
    lower = upper;
  }
  return tax;
}

function computeSeTax(netProfit: number, workIncome: number): number {
  if (netProfit <= 0) return 0;
  const netEarnings = netProfit * SE_NET_EARNINGS_FACTOR;

  // W-2 wages use up the Social Security wage base first.
  const ssBaseRemaining = Math.max(0, SS_WAGE_BASE - workIncome);
  const socialSecurityTax = Math.min(netEarnings, ssBaseRemaining) * SE_TAX_RATE_SS;
  const medicareTax = netEarnings * SE_TAX_RATE_MEDICARE;

  const combinedEarnings = netEarnings + workIncome;
  const overThreshold = Math.max(0, combinedEarnings - ADDITIONAL_MEDICARE_THRESHOLD_SINGLE);
  const additionalMedicare = Math.min(netEarnings, overThreshold) * ADDITIONAL_MEDICARE_RATE;

  return socialSecurityTax + medicareTax + additionalMedicare;
}

function computeQbiDeduction(netProfit: number, taxableIncomeBeforeQbi: number): number {
  if (netProfit <= 0) return 0;
  const fullDeduction = netProfit * QBI_RATE;
  if (taxableIncomeBeforeQbi <= QBI_PHASE_IN_START_SINGLE) return fullDeduction;
  const phaseInEnd = QBI_PHASE_IN_START_SINGLE + QBI_PHASE_IN_RANGE_SINGLE;
  if (taxableIncomeBeforeQbi >= phaseInEnd) return 0;
  const progress = (taxableIncomeBeforeQbi - QBI_PHASE_IN_START_SINGLE) / QBI_PHASE_IN_RANGE_SINGLE;
  return fullDeduction * (1 - progress);
}

function computeTipsDeduction(tips: number, approxMagi: number): number {
  if (tips <= 0) return 0;
  let deduction = Math.min(tips, TIPS_DEDUCTION_CAP);
  if (approxMagi > TIPS_PHASEOUT_START_SINGLE) {
    const excessThousands = Math.ceil((approxMagi - TIPS_PHASEOUT_START_SINGLE) / 1000);
    deduction = Math.max(0, deduction - excessThousands * TIPS_PHASEOUT_PER_1000);
  }
  return deduction;
}

export function estimateTax(input: TaxEstimateInput): TaxEstimateResult {
  const netProfit = Math.max(0, input.llcNetProfit);
  const workIncome = Math.max(0, input.workIncome);
  const tips = Math.max(0, input.tips);

  const seTax = computeSeTax(netProfit, workIncome);
  const halfSeTaxDeduction = seTax / 2;

  // Scholarship refunds are treated as excluded from the start (per the
  // user's own determination) so they never enter total income at all.
  const totalIncome = workIncome + netProfit + tips;

  const approxMagi = totalIncome - halfSeTaxDeduction;
  const tipsDeduction = computeTipsDeduction(tips, approxMagi);

  const agi = totalIncome - halfSeTaxDeduction - tipsDeduction;
  const taxableIncomeBeforeQbi = Math.max(0, agi - STANDARD_DEDUCTION_SINGLE);
  const qbiDeduction = computeQbiDeduction(netProfit, taxableIncomeBeforeQbi);
  const taxableIncome = Math.max(0, taxableIncomeBeforeQbi - qbiDeduction);

  const federalIncomeTax = progressiveTax(taxableIncome);
  const totalTaxLiability = federalIncomeTax + seTax;
  const effectiveRate = totalIncome > 0 ? totalTaxLiability / totalIncome : 0;
  const balanceDue = totalTaxLiability - Math.max(0, input.federalWithheld);

  return {
    seTax,
    halfSeTaxDeduction,
    tipsDeduction,
    qbiDeduction,
    standardDeduction: STANDARD_DEDUCTION_SINGLE,
    totalIncome,
    agi,
    taxableIncome,
    federalIncomeTax,
    totalTaxLiability,
    effectiveRate,
    balanceDue,
  };
}

export function llcNetProfitForYear(
  transactions: Transaction[],
  year: number
): { income: number; expense: number; net: number } {
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    const d = new Date(t.date);
    if (d < start || d >= end) continue;
    const total = transactionTotal(t);
    if (t.type === "income") income += total;
    else expense += total;
  }
  return { income, expense, net: income - expense };
}
