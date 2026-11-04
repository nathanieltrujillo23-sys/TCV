import { describe, expect, it } from "vitest";
import { LESSONS, lessonById } from "./index";

describe("lesson content", () => {
  it("has eight numbered modules with unique ids", () => {
    expect(LESSONS.map((l) => l.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(8);
  });

  it("every lesson has objectives, a body, key terms, a case, and a 3 question quiz", () => {
    for (const l of LESSONS) {
      expect(l.objectives.length, l.id).toBeGreaterThanOrEqual(3);
      expect(l.sections.length, l.id).toBeGreaterThanOrEqual(3);
      expect(l.keyTerms.length, l.id).toBeGreaterThanOrEqual(4);
      expect(l.caseStudy.paragraphs.length, l.id).toBeGreaterThan(0);
      expect(l.quiz.length, l.id).toBe(3);
      for (const q of l.quiz) {
        expect(q.answer, q.question).toBeGreaterThanOrEqual(0);
        expect(q.answer, q.question).toBeLessThan(q.options.length);
      }
    }
  });

  it("exactly two public sample lessons for the Learn page", () => {
    expect(LESSONS.filter((l) => l.publicSample).map((l) => l.id)).toEqual(["budgeting-cash-flow", "compound-growth"]);
  });

  it("copy avoids em dashes and advice-style wording", () => {
    const text = JSON.stringify(LESSONS);
    expect(text).not.toContain("—");
    expect(text.toLowerCase()).not.toMatch(/you should (buy|sell|invest)|we recommend|guaranteed return/);
  });

  it("looks lessons up by id", () => {
    expect(lessonById("debt")?.number).toBe(3);
    expect(lessonById("nope")).toBeUndefined();
  });
});
