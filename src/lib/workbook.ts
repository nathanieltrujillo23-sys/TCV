import { savingsGoal } from "./calculators";

// The planning workbook: a client's own snapshot, goals, and checklist. Pure
// functions only; the page and the PDF both read their figures from here.

export type Stage = "student" | "first_job" | "early_career";
export type PayType = "hourly" | "salary" | "aid" | "mix";
export type Answer = "yes" | "not_yet" | "not_sure";

export interface Line {
  id: string;
  label: string;
  amount: number | null;
}

export interface DebtLine extends Line {
  /** Interest rate (APR %), optional. */
  rate: number | null;
}

export interface Goal {
  id: string;
  name: string;
  target: number | null;
  saved: number | null;
  /** Target month as YYYY-MM. */
  date: string;
}

export interface WorkbookData {
  version: 1;
  stage: Stage | null;
  payType: PayType | null;
  /** Monthly amounts. */
  income: Line[];
  fixed: Line[];
  variable: Line[];
  /** Yearly amounts (car registration, gifts, subscriptions); shown per month as amount / 12. */
  occasional: Line[];
  /** Checking and savings: what counts toward "months covered". */
  cash: Line[];
  otherAssets: Line[];
  debts: DebtLine[];
  goals: Goal[];
  checklist: Record<string, Answer>;
}

export const MAX_GOALS = 5;
export const MAX_LINES = 15;

/** Default line labels, looked up by the caller (so they arrive in the user's language). */
export const DEFAULT_LINES = {
  income: ["wb.line.takeHome", "wb.line.partTime", "wb.line.aid", "wb.line.family"],
  fixed: ["wb.line.rent", "wb.line.phone", "wb.line.insurance", "wb.line.subscriptions"],
  variable: ["wb.line.groceries", "wb.line.dining", "wb.line.gas", "wb.line.fun"],
  occasional: ["wb.line.books", "wb.line.travel", "wb.line.gifts", "wb.line.carRegistration"],
  cash: ["wb.line.checking", "wb.line.savings"],
  otherAssets: ["wb.line.retirement", "wb.line.investments", "wb.line.car"],
  debts: ["wb.line.federalLoans", "wb.line.privateLoans", "wb.line.creditCards", "wb.line.carLoan"],
} as const;

export type DefaultLineKey = (typeof DEFAULT_LINES)[keyof typeof DEFAULT_LINES][number];

let counter = 0;
export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  counter += 1;
  return `id-${Date.now()}-${counter}`;
}

export function newLine(label = ""): Line {
  return { id: newId(), label, amount: null };
}

export function newDebt(label = ""): DebtLine {
  return { id: newId(), label, amount: null, rate: null };
}

export function newGoal(): Goal {
  return { id: newId(), name: "", target: null, saved: null, date: "" };
}

export function createWorkbook(label: (key: DefaultLineKey) => string): WorkbookData {
  const lines = (keys: readonly DefaultLineKey[]) => keys.map((k) => newLine(label(k)));
  return {
    version: 1,
    stage: null,
    payType: null,
    income: lines(DEFAULT_LINES.income),
    fixed: lines(DEFAULT_LINES.fixed),
    variable: lines(DEFAULT_LINES.variable),
    occasional: lines(DEFAULT_LINES.occasional),
    cash: lines(DEFAULT_LINES.cash),
    otherAssets: lines(DEFAULT_LINES.otherAssets),
    debts: DEFAULT_LINES.debts.map((k) => newDebt(label(k))),
    goals: [newGoal()],
    checklist: {},
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const sum = (lines: Line[]) => round2(lines.reduce((total, l) => total + (l.amount ?? 0), 0));

export interface Snapshot {
  monthlyIncome: number;
  monthlyExpenses: number;
  /** Income minus expenses, per month. */
  cashFlow: number;
  cash: number;
  totalAssets: number;
  totalDebts: number;
  netWorth: number;
  /** Cash divided by monthly expenses; null when there are no expenses yet. */
  monthsCovered: number | null;
}

export function snapshot(w: WorkbookData): Snapshot {
  const monthlyIncome = sum(w.income);
  const monthlyExpenses = round2(sum(w.fixed) + sum(w.variable) + sum(w.occasional) / 12);
  const cash = sum(w.cash);
  const totalAssets = round2(cash + sum(w.otherAssets));
  const totalDebts = sum(w.debts);
  return {
    monthlyIncome,
    monthlyExpenses,
    cashFlow: round2(monthlyIncome - monthlyExpenses),
    cash,
    totalAssets,
    totalDebts,
    netWorth: round2(totalAssets - totalDebts),
    monthsCovered: monthlyExpenses > 0 ? Math.round((cash / monthlyExpenses) * 10) / 10 : null,
  };
}

/** Whole months from this month to the target month (a target of next month is 1). */
export function monthsUntil(target: string, today: Date): number | null {
  const m = /^(\d{4})-(\d{2})$/.exec(target);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return year * 12 + (month - 1) - (today.getFullYear() * 12 + today.getMonth());
}

export type GoalStatus = "incomplete" | "reached" | "pastDate" | "onTrack";

export interface GoalPlan {
  status: GoalStatus;
  months: number | null;
  /** Straight monthly saving needed (no growth assumed); null unless status is onTrack. */
  monthlyNeeded: number | null;
}

/** Monthly saving a goal implies. No investment return is assumed: this is a savings plan, not a projection. */
export function goalPlan(goal: Goal, today: Date): GoalPlan {
  const months = monthsUntil(goal.date, today);
  if (!goal.name.trim() || goal.target === null || goal.target <= 0 || months === null) {
    return { status: "incomplete", months, monthlyNeeded: null };
  }
  if ((goal.saved ?? 0) >= goal.target) return { status: "reached", months, monthlyNeeded: 0 };
  if (months <= 0) return { status: "pastDate", months, monthlyNeeded: null };
  return { status: "onTrack", months, monthlyNeeded: savingsGoal(goal.target, goal.saved ?? 0, months, 0).monthlyNeeded };
}

export function totalMonthlyForGoals(goals: Goal[], today: Date): number {
  return round2(goals.reduce((total, g) => total + (goalPlan(g, today).monthlyNeeded ?? 0), 0));
}

/**
 * Questions to bring to a licensed professional: one for each checklist item
 * answered "Not sure", plus a few that come from the numbers. Returns ids; the
 * text lives in the strings file under wb.q.<id>.
 */
export function professionalQuestions(w: WorkbookData, visibleChecklist: string[], today: Date): string[] {
  const ids = visibleChecklist.filter((id) => w.checklist[id] === "not_sure");
  const s = snapshot(w);
  const hasExpenses = s.monthlyExpenses > 0;
  const completeGoals = w.goals.filter((g) => goalPlan(g, today).status === "onTrack");
  if (hasExpenses && s.cashFlow < 0) ids.push("negativeCashFlow");
  if (completeGoals.length > 0 && hasExpenses && totalMonthlyForGoals(w.goals, today) > Math.max(s.cashFlow, 0)) {
    ids.push("goalsExceedCashFlow");
  }
  if (completeGoals.length > 0 && s.totalDebts > 0) ids.push("debtVsGoals");
  return ids;
}

export interface Progress {
  snapshot: boolean;
  goals: boolean;
  checklist: boolean;
  done: number;
  total: number;
}

/** The three parts a client fills in. The workbook counts as finished when all three are. */
export function workbookProgress(w: WorkbookData, visibleChecklist: string[], today: Date): Progress {
  const s = snapshot(w);
  const parts = {
    snapshot: s.monthlyIncome > 0 && s.monthlyExpenses > 0,
    goals: w.goals.some((g) => ["onTrack", "reached"].includes(goalPlan(g, today).status)),
    checklist: visibleChecklist.length > 0 && visibleChecklist.every((id) => w.checklist[id] !== undefined),
  };
  const done = Object.values(parts).filter(Boolean).length;
  return { ...parts, done, total: 3 };
}

/** Reads a saved workbook defensively: unknown or missing fields fall back to empty values. */
export function parseWorkbook(raw: unknown): WorkbookData | null {
  if (!raw || typeof raw !== "object" || (raw as { version?: unknown }).version !== 1) return null;
  const r = raw as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const lines = (v: unknown): Line[] =>
    Array.isArray(v) ? v.slice(0, MAX_LINES).map((l) => ({ id: str(l?.id) || newId(), label: str(l?.label), amount: num(l?.amount) })) : [];
  const debts = (v: unknown): DebtLine[] =>
    Array.isArray(v) ? v.slice(0, MAX_LINES).map((l) => ({ id: str(l?.id) || newId(), label: str(l?.label), amount: num(l?.amount), rate: num(l?.rate) })) : [];
  const goals: Goal[] = Array.isArray(r.goals)
    ? r.goals.slice(0, MAX_GOALS).map((g) => ({ id: str(g?.id) || newId(), name: str(g?.name), target: num(g?.target), saved: num(g?.saved), date: str(g?.date) }))
    : [];
  const checklist: Record<string, Answer> = {};
  if (r.checklist && typeof r.checklist === "object") {
    for (const [k, v] of Object.entries(r.checklist)) if (v === "yes" || v === "not_yet" || v === "not_sure") checklist[k] = v;
  }
  const stages: Stage[] = ["student", "first_job", "early_career"];
  const payTypes: PayType[] = ["hourly", "salary", "aid", "mix"];
  return {
    version: 1,
    stage: stages.includes(r.stage as Stage) ? (r.stage as Stage) : null,
    payType: payTypes.includes(r.payType as PayType) ? (r.payType as PayType) : null,
    income: lines(r.income),
    fixed: lines(r.fixed),
    variable: lines(r.variable),
    occasional: lines(r.occasional),
    cash: lines(r.cash),
    otherAssets: lines(r.otherAssets),
    debts: debts(r.debts),
    goals: goals.length ? goals : [newGoal()],
    checklist,
  };
}
