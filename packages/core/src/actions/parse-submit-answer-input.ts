import type { Mode } from "../domain/attempt";

export type SubmitAnswerInput = {
  id: string;
  questionId: string;
  mode: Mode;
  isCorrect: boolean;
};

export type ParseSubmitAnswerInputResult =
  | { ok: true; data: SubmitAnswerInput }
  | { ok: false; errors: string[] };

// 異常なpayload(オフライン中の暴走等)を弾くための緩い上限。特に意味のある値ではない。
const MAX_STRING_LENGTH = 200;

function isValidId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_STRING_LENGTH;
}

/**
 * `submitAnswer`が受け取るリクエストボディの健全性検証。
 * `userId`はここでは扱わない(呼び出し側がセッションから別途取得して合成する)。
 */
export function parseSubmitAnswerInput(body: unknown): ParseSubmitAnswerInputResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, errors: ["リクエストボディはオブジェクトである必要があります"] };
  }

  const { id, questionId, mode, isCorrect } = body as Record<string, unknown>;
  const errors: string[] = [];

  if (!isValidId(id)) errors.push("id が不正です");
  if (!isValidId(questionId)) errors.push("questionId が不正です");
  if (mode !== "quiz" && mode !== "flashcard") errors.push("mode が不正です");
  if (typeof isCorrect !== "boolean") errors.push("isCorrect が不正です");

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: { id: id as string, questionId: questionId as string, mode: mode as Mode, isCorrect: isCorrect as boolean },
  };
}
