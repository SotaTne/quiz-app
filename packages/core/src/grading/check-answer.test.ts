import { describe, expect, it } from "vitest";
import type { Question } from "../domain/question";
import { checkAnswer } from "./check-answer";

const question: Question = { id: "q1", question: "1+1?", answer: "2", explanation: null };

describe("checkAnswer", () => {
  it("returns true for an exact match", () => {
    expect(checkAnswer(question, "2")).toBe(true);
  });

  it("ignores surrounding whitespace and case", () => {
    expect(checkAnswer(question, "  2  ")).toBe(true);
    expect(checkAnswer({ ...question, answer: "Object" }, "object")).toBe(true);
  });

  it("returns false for a wrong answer", () => {
    expect(checkAnswer(question, "3")).toBe(false);
  });
});
