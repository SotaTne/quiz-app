import type { Question } from "../domain/question.ts";
import type { QuestionAccuracy } from "../store.ts";

export type FilterType = "all" | "wrong" | "weak";

/** これ以下の正答率(全履歴)を「苦手問題」とみなす。 */
const WEAK_ACCURACY_THRESHOLD = 0.4;

/**
 * `latestAttempt`/`accuracy`は事前に1ユーザー+1modeに絞り込み済みであること。
 * - "wrong": 直近の回答が不正解だった問題だけ(未回答は含まない)。
 * - "weak": 全履歴の正答率がWEAK_ACCURACY_THRESHOLD以下の問題だけ(未回答は含まない)。
 */
export function applyFilter(
  filterType: FilterType,
  questions: Question[],
  latestAttempt: Map<string, { isCorrect: boolean }>,
  accuracy: Map<string, QuestionAccuracy>,
): Question[] {
  if (filterType === "all") return questions;

  if (filterType === "wrong") {
    return questions.filter((question) => {
      const latest = latestAttempt.get(question.id);
      return latest !== undefined && !latest.isCorrect;
    });
  }

  return questions.filter((question) => {
    const stat = accuracy.get(question.id);
    if (!stat || stat.total === 0) return false;
    return stat.correct / stat.total <= WEAK_ACCURACY_THRESHOLD;
  });
}
