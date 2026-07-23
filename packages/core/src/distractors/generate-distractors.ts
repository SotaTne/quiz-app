import type { Question, QuestionSet } from "../domain/question.ts";

const normalize = (answer: string) => answer.trim().toLowerCase();

function uniqueOtherAnswers(pool: Question[], target: Question, exclude: Set<string>): string[] {
  const seen = new Set(exclude);
  const result: string[] = [];
  for (const candidate of pool) {
    if (candidate.id === target.id) continue;
    const key = normalize(candidate.answer);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(candidate.answer);
  }
  return result;
}

function sample(pool: string[], count: number, random: () => number): string[] {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const atI = shuffled[i];
    const atJ = shuffled[j];
    if (atI === undefined || atJ === undefined) continue;
    shuffled[i] = atJ;
    shuffled[j] = atI;
  }
  return shuffled.slice(0, count);
}

/**
 * `question`の誤答選択肢を3つ選ぶ。同じセット内の他問題の答えを優先し、足りない場合は全セットから補う。
 * どこを探しても3つ揃わない場合はnullを返す。
 */
export function generateDistractors(
  question: Question,
  set: QuestionSet,
  allSets: QuestionSet[],
  options: { random?: () => number } = {},
): string[] | null {
  const random = options.random ?? Math.random;
  const excludeTarget = new Set([normalize(question.answer)]);

  const sameSetCandidates = uniqueOtherAnswers(set.questions, question, excludeTarget);

  let candidates = sameSetCandidates;
  if (candidates.length < 3) {
    const alreadyUsed = new Set([...excludeTarget, ...sameSetCandidates.map(normalize)]);
    const otherSetCandidates = uniqueOtherAnswers(
      allSets.flatMap((s) => s.questions),
      question,
      alreadyUsed,
    );
    candidates = [...sameSetCandidates, ...otherSetCandidates];
  }

  if (candidates.length < 3) return null;
  return sample(candidates, 3, random);
}
