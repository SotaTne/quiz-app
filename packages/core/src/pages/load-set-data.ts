import type { AuthLike } from "../actions/submit-answer.ts";
import type { QuestionSet } from "../domain/question.ts";
import type { QuestionAccuracy, Store } from "../store.ts";

type AttemptEntry = [string, { isCorrect: boolean }];
type AccuracyEntry = [string, QuestionAccuracy];

export type SetData =
  | { found: false }
  | { found: true; loggedIn: false }
  | {
      found: true;
      loggedIn: true;
      userId: string;
      set: QuestionSet;
      allSets: QuestionSet[];
      quizAttempts: AttemptEntry[];
      flashcardAttempts: AttemptEntry[];
      quizAccuracy: AccuracyEntry[];
      flashcardAccuracy: AccuracyEntry[];
    };

export type LoadSetDataInput = {
  request: Request;
  store: Store;
  auth: AuthLike;
  questionSets: QuestionSet[];
  setId: string;
};

/** セット詳細("/sets/*")の表示データを組み立てる。セットが存在しない/未ログインの場合はその旨だけ返す。 */
export async function loadSetData({
  request,
  store,
  auth,
  questionSets,
  setId,
}: LoadSetDataInput): Promise<SetData> {
  const set = questionSets.find((candidate) => candidate.id === setId);
  if (!set) return { found: false };

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return { found: true, loggedIn: false };

  const [quizAttempts, flashcardAttempts, quizAccuracy, flashcardAccuracy] = await Promise.all([
    store.listLatestAttempts(session.user.id, "quiz"),
    store.listLatestAttempts(session.user.id, "flashcard"),
    store.listAccuracy(session.user.id, "quiz"),
    store.listAccuracy(session.user.id, "flashcard"),
  ]);

  return {
    found: true,
    loggedIn: true,
    userId: session.user.id,
    set,
    allSets: questionSets,
    quizAttempts: [...quizAttempts.entries()],
    flashcardAttempts: [...flashcardAttempts.entries()],
    quizAccuracy: [...quizAccuracy.entries()],
    flashcardAccuracy: [...flashcardAccuracy.entries()],
  };
}
