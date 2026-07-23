import { describe, expect, it } from "vitest";
import type { Question, QuestionSet } from "../domain/question";
import { generateDistractors } from "./generate-distractors";

function q(id: string, answer: string): Question {
  return { id, question: `question ${id}`, answer, explanation: null };
}

function set(id: string, questions: Question[]): QuestionSet {
  return { id, title: id, questions };
}

describe("generateDistractors", () => {
  it("samples 3 distractors from the same set, excluding the question's own answer", () => {
    const target = q("t", "correct");
    const current = set("s1", [target, q("a", "wrong-a"), q("b", "wrong-b"), q("c", "wrong-c"), q("d", "wrong-d")]);

    const result = generateDistractors(target, current, [current], { random: () => 0 });

    expect(result).not.toBeNull();
    expect(result).toHaveLength(3);
    expect(result).not.toContain("correct");
  });

  it("deduplicates answers that only differ by whitespace/case", () => {
    const target = q("t", "correct");
    const current = set("s1", [
      target,
      q("a", "Wrong"),
      q("b", " wrong "),
      q("c", "WRONG"),
      q("d", "other"),
      q("e", "another"),
    ]);

    const result = generateDistractors(target, current, [current], { random: () => 0 });

    expect(result).not.toBeNull();
    expect(result).toHaveLength(3);
    // "Wrong"/" wrong "/"WRONG" count as one candidate, so only one of them can appear
    const wrongVariants = result?.filter((a) => a.trim().toLowerCase() === "wrong") ?? [];
    expect(wrongVariants).toHaveLength(1);
  });

  it("falls back to other sets when the current set doesn't have enough distinct answers", () => {
    const target = q("t", "correct");
    const current = set("s1", [target, q("a", "only-one")]);
    const other = set("s2", [q("x", "from-other-1"), q("y", "from-other-2")]);

    const result = generateDistractors(target, current, [current, other], { random: () => 0 });

    expect(result).not.toBeNull();
    expect(result).toHaveLength(3);
  });

  it("returns null when fewer than 3 distinct distractors exist anywhere", () => {
    const target = q("t", "correct");
    const current = set("s1", [target, q("a", "only-one")]);

    const result = generateDistractors(target, current, [current], { random: () => 0 });

    expect(result).toBeNull();
  });
});
