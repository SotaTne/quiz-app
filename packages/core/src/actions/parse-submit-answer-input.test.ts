import { describe, expect, it } from "vitest";
import { parseSubmitAnswerInput } from "./parse-submit-answer-input";

const valid = { id: "a1", questionId: "q1", mode: "quiz", isCorrect: true };

describe("parseSubmitAnswerInput", () => {
  it("正しい形の入力を受け入れる", () => {
    const result = parseSubmitAnswerInput(valid);

    expect(result).toEqual({ ok: true, data: valid });
  });

  it("オブジェクトでない入力を拒否する", () => {
    expect(parseSubmitAnswerInput(null).ok).toBe(false);
    expect(parseSubmitAnswerInput("string").ok).toBe(false);
    expect(parseSubmitAnswerInput(42).ok).toBe(false);
  });

  it("idが空文字・欠落・非文字列なら拒否する", () => {
    expect(parseSubmitAnswerInput({ ...valid, id: "" }).ok).toBe(false);
    expect(parseSubmitAnswerInput({ ...valid, id: undefined }).ok).toBe(false);
    expect(parseSubmitAnswerInput({ ...valid, id: 123 }).ok).toBe(false);
  });

  it("idが長すぎる場合は拒否する(異常なpayload対策)", () => {
    expect(parseSubmitAnswerInput({ ...valid, id: "a".repeat(201) }).ok).toBe(false);
  });

  it("questionIdが空文字・欠落・非文字列なら拒否する", () => {
    expect(parseSubmitAnswerInput({ ...valid, questionId: "" }).ok).toBe(false);
    expect(parseSubmitAnswerInput({ ...valid, questionId: undefined }).ok).toBe(false);
  });

  it("modeが'quiz'/'flashcard'以外なら拒否する", () => {
    expect(parseSubmitAnswerInput({ ...valid, mode: "learn" }).ok).toBe(false);
    expect(parseSubmitAnswerInput({ ...valid, mode: undefined }).ok).toBe(false);
  });

  it("isCorrectが真偽値でなければ拒否する", () => {
    expect(parseSubmitAnswerInput({ ...valid, isCorrect: "true" }).ok).toBe(false);
    expect(parseSubmitAnswerInput({ ...valid, isCorrect: undefined }).ok).toBe(false);
  });

  it("拒否した場合はエラー内容の配列を返す", () => {
    const result = parseSubmitAnswerInput({ id: "", questionId: "", mode: "x", isCorrect: "y" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });
});
