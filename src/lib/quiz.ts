export const PASS_CORRECT = 2;

export interface QuizResult {
  correct: number;
  total: number;
  /** Whole percent, 0 to 100. */
  score: number;
  passed: boolean;
}

/** Scores answers (index per question, null = unanswered). Two of three correct passes. */
export function scoreQuiz(answers: (number | null)[], correctAnswers: number[]): QuizResult {
  const correct = correctAnswers.filter((a, i) => answers[i] === a).length;
  const total = correctAnswers.length;
  return { correct, total, score: Math.round((correct / total) * 100), passed: correct >= Math.min(PASS_CORRECT, total) };
}
