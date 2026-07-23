import type { Question } from "../domain/question";

export type FilterType = "all" | "weak";

/** `latestAttempt`は事前に1ユーザー+1modeに絞り込み済み(questionIdごとに1件)であること。 */
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
