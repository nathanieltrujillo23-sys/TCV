import { describe, expect, it } from "vitest";
import { scoreQuiz } from "./quiz";

describe("scoreQuiz", () => {
  it("all correct", () => {
    expect(scoreQuiz([1, 0, 2], [1, 0, 2])).toEqual({ correct: 3, total: 3, score: 100, passed: true });
  });
  it("two of three passes at 67%", () => {
    expect(scoreQuiz([1, 0, 0], [1, 0, 2])).toEqual({ correct: 2, total: 3, score: 67, passed: true });
  });
  it("one of three does not pass", () => {
    expect(scoreQuiz([1, 2, null], [1, 0, 2])).toEqual({ correct: 1, total: 3, score: 33, passed: false });
  });
});
