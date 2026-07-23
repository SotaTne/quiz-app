import type { Question } from "../domain/question";

export type FilterType = "all" | "weak";

/** `latestAttempt` should already be scoped to one user + one mode (one entry per questionId). */
export function applyFilter(
  filterType: FilterType,
  questions: Question[],
  latestAttempt: Map<string, { isCorrect: boolean }>,
): Question[] {
  if (filterType === "all") return questions;

  return questions.filter((question) => {
    const latest = latestAttempt.get(question.id);
    return !latest || !latest.isCorrect;
  });
}
