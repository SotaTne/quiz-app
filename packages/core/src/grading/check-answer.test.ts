import { describe, expect, it } from "vitest";
import type { Question } from "../domain/question";
import { checkAnswer } from "./check-answer";

const question: Question = { id: "q1", question: "1+1?", answer: "2", explanation: null };

describe("checkAnswer", () => {
  it("完全一致ならtrueを返す", () => {
    expect(checkAnswer(question, "2")).toBe(true);
  });

  it("前後の空白と大文字小文字を無視する", () => {
    expect(checkAnswer(question, "  2  ")).toBe(true);
    expect(checkAnswer({ ...question, answer: "Object" }, "object")).toBe(true);
  });

  it("不正解ならfalseを返す", () => {
    expect(checkAnswer(question, "3")).toBe(false);
  });
});
