import type { Question } from "../domain/question";

const normalize = (value: string) => value.trim().toLowerCase();

/**
 * Client-side correctness check for quiz mode. Not a security boundary — the answer
 * data is already bundled to the client (see SPEC.md 3.1), so this only decides what
 * gets recorded as `isCorrect`, not who is allowed to see the answer.
 */
export function checkAnswer(question: Question, selectedAnswer: string): boolean {
  return normalize(question.answer) === normalize(selectedAnswer);
}
