import type { AuthLike } from "../actions/submit-answer.ts";
import type { QuestionSet } from "../domain/question.ts";
import type { Store } from "../store.ts";
import type { SetSummary } from "./set-list-view.tsx";

export type HomeData = { loggedIn: false } | { loggedIn: true; sets: SetSummary[] };

export type LoadHomeDataInput = {
  request: Request;
  store: Store;
  auth: AuthLike;
  questionSets: QuestionSet[];
};

/** ルート("/")の表示データを組み立てる。未ログインならセット一覧は取得しない。 */
export async function loadHomeData({ request, store, auth, questionSets }: LoadHomeDataInput): Promise<HomeData> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return { loggedIn: false };

  const latestAttempts = await store.listLatestAttempts(session.user.id, "quiz");
  const sets: SetSummary[] = questionSets.map((set) => {
    const answered = set.questions.filter((question) => latestAttempts.has(question.id));
    const masteryPercent =
      answered.length === 0
        ? null
        : Math.round(
            (answered.filter((question) => latestAttempts.get(question.id)?.isCorrect).length /
              answered.length) *
              100,
          );
    return { set, masteryPercent };
  });

  return { loggedIn: true, sets };
}
