import type { StringKey } from "../i18n/en";
import type { Stage } from "../lib/workbook";

/** One "Where you stand" item. Text lives in the strings file under wb.check.<id> and wb.q.<id>. */
export interface ChecklistItem {
  id: string;
  /** Stages that see this item; empty means everyone. */
  stages: Stage[];
  /** Module that explains the topic, if the course covers it. */
  lessonId: string | null;
}

export const CHECKLIST: ChecklistItem[] = [
  { id: "emergency", stages: [], lessonId: "emergency-funds" },
  { id: "budget", stages: [], lessonId: "budgeting-cash-flow" },
  { id: "creditScore", stages: [], lessonId: "debt" },
  { id: "cardInFull", stages: [], lessonId: "debt" },
  { id: "studentLoans", stages: ["student", "first_job"], lessonId: "debt" },
  { id: "employerMatch", stages: ["first_job", "early_career"], lessonId: "retirement-accounts" },
  { id: "rothVsTraditional", stages: [], lessonId: "retirement-accounts" },
  { id: "investmentRisk", stages: [], lessonId: "risk-diversification" },
  { id: "healthCoverage", stages: [], lessonId: null },
  { id: "rentersInsurance", stages: [], lessonId: null },
  { id: "beneficiaries", stages: ["first_job", "early_career"], lessonId: null },
  { id: "taxes", stages: [], lessonId: null },
  { id: "goalsWritten", stages: [], lessonId: "financial-objectives" },
];

export function checklistFor(stage: Stage | null): ChecklistItem[] {
  return CHECKLIST.filter((item) => item.stages.length === 0 || (stage !== null && item.stages.includes(stage)));
}

export const checkKey = (id: string) => `wb.check.${id}` as StringKey;
export const questionKey = (id: string) => `wb.q.${id}` as StringKey;
