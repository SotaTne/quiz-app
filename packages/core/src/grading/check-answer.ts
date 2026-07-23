import type { Question } from "../domain/question";

const normalize = (value: string) => value.trim().toLowerCase();

/**
 * 4択モードのクライアント側正誤判定。セキュリティ境界ではない — 正解データは
 * すでにクライアントへ配信済み(SPEC.md 3.1参照)なので、これは「誰が答えを見られるか」
 * ではなく「`isCorrect`として何を記録するか」だけを決める関数。
 */
export function checkAnswer(question: Question, selectedAnswer: string): boolean {
  return normalize(question.answer) === normalize(selectedAnswer);
}
