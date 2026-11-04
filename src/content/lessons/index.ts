import type { Lesson } from "./types";
import { budgeting } from "./01-budgeting";
import { emergencyFunds } from "./02-emergency-funds";
import { debt } from "./03-debt";
import { compoundGrowth } from "./04-compound-growth";
import { risk } from "./05-risk";
import { retirement } from "./06-retirement";
import { objectives } from "./07-objectives";
import { advisers } from "./08-advisers";

export const LESSONS: Lesson[] = [budgeting, emergencyFunds, debt, compoundGrowth, risk, retirement, objectives, advisers];

export function lessonById(id: string | undefined): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

export type { Lesson, LessonTool, QuizQuestion } from "./types";
