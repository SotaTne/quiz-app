import type { Store } from "../store";
import { parseSubmitAnswerInput } from "./parse-submit-answer-input";

/**
 * `createAuth()`が返すインスタンスのうち、ここで必要な部分だけの最小構造型。
 * better-authの型を丸ごとimportしない(store.tsのvite型と同じ理由: 依存を最小限にする)。
 */
export type AuthLike = {
  api: {
    getSession(input: { headers: Headers }): Promise<{ user: { id: string } } | null>;
  };
};

export type SubmitAnswerDeps = {
  store: Store;
  auth: AuthLike;
};

/**
 * 4択・フラッシュカード共通の回答記録エンドポイント(SPEC.md 3.5)。
 * クライアントは`isCorrect`を自分で計算して送るが、`userId`は必ずセッションから取る
 * (クライアント入力のuserIdは信用しない)。`Store.recordAttempt`が`id`でINSERT OR IGNOREするため冪等。
 *
 * ステータスコードはクライアント側の再送方針と対応する:
 * - 401: 未ログイン → 再送しても解決しないため破棄
 * - 400/422: 入力不正 → 再送しても解決しないため破棄
 * - 204: 成功
 * (5xx/ネットワークエラーは再送対象。ここでは明示的には返さず、例外はそのまま呼び出し元に伝播する)
 */
export async function submitAnswer(request: Request, deps: SubmitAnswerDeps): Promise<Response> {
  const session = await deps.auth.api.getSession({ headers: request.headers });
  if (!session) return new Response(null, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  const parsed = parseSubmitAnswerInput(body);
  if (!parsed.ok) {
    return new Response(JSON.stringify({ errors: parsed.errors }), {
      status: 422,
      headers: { "content-type": "application/json" },
    });
  }

  await deps.store.recordAttempt({ ...parsed.data, userId: session.user.id });
  return new Response(null, { status: 204 });
}
