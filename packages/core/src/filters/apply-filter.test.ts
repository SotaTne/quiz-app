import { describe, expect, it } from "vitest";
import type { Question } from "../domain/question";
import { applyFilter } from "./apply-filter";

function q(id: string): Question {
  return { id, question: `question ${id}`, answer: "a", explanation: null };
}

describe("applyFilter", () => {
  const questions = [q("a"), q("b"), q("c")];

  it("filterTypeが'all'なら全問題を返す", () => {
    const latest = new Map([["a", { isCorrect: true }]]);

    expect(applyFilter("all", questions, latest)).toEqual(questions);
  });

  it("filterTypeが'weak'なら未回答または直近が不正解の問題だけ残す", () => {
    const latest = new Map([
      ["a", { isCorrect: true }],
      ["b", { isCorrect: false }],
      // "c"は一度も回答していない
    ]);

    const result = applyFilter("weak", questions, latest);

    expect(result.map((question) => question.id)).toEqual(["b", "c"]);
  });

  it("直近の回答が正解になった問題は除外する", () => {
    const latest = new Map([
      ["a", { isCorrect: true }],
      ["b", { isCorrect: true }],
      ["c", { isCorrect: true }],
    ]);

    expect(applyFilter("weak", questions, latest)).toEqual([]);
  });
});
