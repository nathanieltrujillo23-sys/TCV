export type LessonTool = "compound" | "savings" | "debt" | "retirement";

export interface QuizQuestion {
  question: string;
  options: string[];
  /** Index of the correct option. */
  answer: number;
  explanation: string;
}

/**
 * One course module. Content is English only for now; a Spanish version would
 * be a parallel file with the same ids. Education only: no recommendations.
 */
export interface Lesson {
  id: string;
  number: number;
  title: string;
  summary: string;
  minutes: number;
  objectives: string[];
  sections: { heading: string; paragraphs: string[]; bullets?: string[] }[];
  caseStudy: { title: string; paragraphs: string[] };
  keyTerms: { term: string; definition: string }[];
  quiz: QuizQuestion[];
  tool?: LessonTool;
  /** Shown on the public /learn page as a free sample. */
  publicSample?: boolean;
}
