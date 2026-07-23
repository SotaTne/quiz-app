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
  it("同じセットから、対象問題自身の答えを除いて3つの誤答を選ぶ", () => {
    const target = q("t", "correct");
    const current = set("s1", [target, q("a", "wrong-a"), q("b", "wrong-b"), q("c", "wrong-c"), q("d", "wrong-d")]);

    const result = generateDistractors(target, current, [current], { random: () => 0 });

    expect(result).not.toBeNull();
    expect(result).toHaveLength(3);
    expect(result).not.toContain("correct");
  });

  it("空白・大文字小文字だけが違う答えは重複とみなす", () => {
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
    // "Wrong"/" wrong "/"WRONG" は1つの候補として数えるので、いずれか1つしか出てこない
    const wrongVariants = result?.filter((a) => a.trim().toLowerCase() === "wrong") ?? [];
    expect(wrongVariants).toHaveLength(1);
  });

  it("同一セット内の候補が足りない場合は他のセットから補う", () => {
    const target = q("t", "correct");
    const current = set("s1", [target, q("a", "only-one")]);
    const other = set("s2", [q("x", "from-other-1"), q("y", "from-other-2")]);

    const result = generateDistractors(target, current, [current, other], { random: () => 0 });

    expect(result).not.toBeNull();
    expect(result).toHaveLength(3);
  });

  it("どこを探しても3つ揃わない場合はnullを返す", () => {
    const target = q("t", "correct");
    const current = set("s1", [target, q("a", "only-one")]);

    const result = generateDistractors(target, current, [current], { random: () => 0 });

    expect(result).toBeNull();
  });
});
