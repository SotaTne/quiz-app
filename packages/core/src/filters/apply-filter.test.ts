import { describe, expect, it } from "vitest";
import type { Question } from "../domain/question.ts";
import type { QuestionAccuracy } from "../store.ts";
import { applyFilter } from "./apply-filter.ts";

function q(id: string): Question {
  return { id, question: `question ${id}`, answer: "a", explanation: null };
}

describe("applyFilter", () => {
  const questions = [q("a"), q("b"), q("c")];
  const noAccuracy = new Map<string, QuestionAccuracy>();

  it("filterTypeが'all'なら全問題を返す", () => {
    const latest = new Map([["a", { isCorrect: true }]]);

    expect(applyFilter("all", questions, latest, noAccuracy)).toEqual(questions);
  });

  describe("filterTypeが'wrong'", () => {
    it("直近の回答が不正解の問題だけ残す(未回答は含まない)", () => {
      const latest = new Map([
        ["a", { isCorrect: true }],
        ["b", { isCorrect: false }],
        // "c"は一度も回答していない
      ]);

      const result = applyFilter("wrong", questions, latest, noAccuracy);

      expect(result.map((question) => question.id)).toEqual(["b"]);
    });

    it("直近の回答が正解になった問題は除外する", () => {
      const latest = new Map([
        ["a", { isCorrect: true }],
        ["b", { isCorrect: true }],
        ["c", { isCorrect: true }],
      ]);

      expect(applyFilter("wrong", questions, latest, noAccuracy)).toEqual([]);
    });
  });

  describe("filterTypeが'weak'", () => {
    it("全履歴の正答率が40%以下の問題だけ残す(未回答は含まない)", () => {
      const accuracy = new Map<string, QuestionAccuracy>([
        ["a", { total: 3, correct: 3 }], // 100%
        ["b", { total: 5, correct: 2 }], // 40%
        // "c"は一度も回答していない
      ]);

      const result = applyFilter("weak", questions, new Map(), accuracy);

      expect(result.map((question) => question.id)).toEqual(["b"]);
    });

    it("正答率が40%を超える問題は除外する", () => {
      const accuracy = new Map<string, QuestionAccuracy>([["a", { total: 2, correct: 1 }]]); // 50%

      expect(applyFilter("weak", questions, new Map(), accuracy)).toEqual([]);
    });
  });
});
