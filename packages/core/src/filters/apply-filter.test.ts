import { describe, expect, it } from "vitest";
import type { Question } from "../domain/question";
import { applyFilter } from "./apply-filter";

function q(id: string): Question {
  return { id, question: `question ${id}`, answer: "a", explanation: null };
}

describe("applyFilter", () => {
  const questions = [q("a"), q("b"), q("c")];

  it("returns every question when filterType is 'all'", () => {
    const latest = new Map([["a", { isCorrect: true }]]);

    expect(applyFilter("all", questions, latest)).toEqual(questions);
  });

  it("keeps only questions with no attempt yet or a most-recent wrong attempt when filterType is 'weak'", () => {
    const latest = new Map([
      ["a", { isCorrect: true }],
      ["b", { isCorrect: false }],
      // "c" has never been answered
    ]);

    const result = applyFilter("weak", questions, latest);

    expect(result.map((question) => question.id)).toEqual(["b", "c"]);
  });

  it("excludes a question once its most recent attempt is correct", () => {
    const latest = new Map([
      ["a", { isCorrect: true }],
      ["b", { isCorrect: true }],
      ["c", { isCorrect: true }],
    ]);

    expect(applyFilter("weak", questions, latest)).toEqual([]);
  });
});
