import type { AuthLike } from "../actions/submit-answer.ts";
import type { Question, QuestionSet } from "../domain/question.ts";
import type { Store } from "../store.ts";
import type { SetSummary } from "./set-list-view.tsx";

export type HomeData = { loggedIn: false } | { loggedIn: true; sets: SetSummary[] };

export type LoadHomeDataInput = {
  request: Request;
  store: Store;
  auth: AuthLike;
  questionSets: QuestionSet[];
};

function masteryPercentOf(questions: Question[], latestAttempts: Map<string, { isCorrect: boolean }>): number | null {
  const answered = questions.filter((question) => latestAttempts.has(question.id));
  if (answered.length === 0) return null;
  const correct = answered.filter((question) => latestAttempts.get(question.id)?.isCorrect).length;
  return Math.round((correct / answered.length) * 100);
}

/** ルート("/")の表示データを組み立てる。未ログインならセット一覧は取得しない。 */
export async function loadHomeData({ request, store, auth, questionSets }: LoadHomeDataInput): Promise<HomeData> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return { loggedIn: false };

  const [quizLatestAttempts, flashcardLatestAttempts] = await Promise.all([
    store.listLatestAttempts(session.user.id, "quiz"),
    store.listLatestAttempts(session.user.id, "flashcard"),
  ]);

  const sets: SetSummary[] = questionSets.map((set) => ({
    set,
    quizMasteryPercent: masteryPercentOf(set.questions, quizLatestAttempts),
    flashcardMasteryPercent: masteryPercentOf(set.questions, flashcardLatestAttempts),
  }));

  return { loggedIn: true, sets };
}
