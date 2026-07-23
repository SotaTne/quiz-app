// クライアントバンドルに含めて安全なものだけをここに置く(node:fs/node:pathやdrizzle-ormに
// 触れるコードは絶対に含めない)。サーバー専用のデータ取得/永続化は"@quiz/core/server"へ。
// これを混ぜると、routeファイルが「ページ本体」と「サーバー専用のloader」を同じimport文で
// 取り込んだ際に、バンドラがクライアント向けバンドルへもnode:fs等を巻き込んでクラッシュする
// (実際にブラウザで踏んだ不具合: derive-set-id.tsのnode:pathアクセスがクライアントで例外)。

export type { Question, QuestionSet } from "./domain/question.ts";
export type { Attempt, Mode } from "./domain/attempt.ts";

// quizContentPlugin(vite設定の読み込み時にしか使わない、node:fs/node:pathに触れる)は
// ここには置かない。vite.config.tsからは"@quiz/core/vite-plugin"を直接importすること。

export { generateDistractors } from "./distractors/generate-distractors.ts";

export { applyFilter } from "./filters/apply-filter.ts";
export type { FilterType } from "./filters/apply-filter.ts";

export { checkAnswer } from "./grading/check-answer.ts";

export { SetListView } from "./pages/set-list-view.tsx";
export type { SetListViewProps, SetSummary } from "./pages/set-list-view.tsx";

export { FlashcardView } from "./pages/flashcard-view.tsx";
export type { FlashcardViewProps } from "./pages/flashcard-view.tsx";

export { FourChoiceView } from "./pages/four-choice-view.tsx";
export type { FourChoiceViewProps } from "./pages/four-choice-view.tsx";

export { RootLayout } from "./pages/root-layout.tsx";
export { LoginButton } from "./pages/login-button.tsx";
export { LogoutButton } from "./pages/logout-button.tsx";

export { QuizSession } from "./pages/quiz-session.tsx";
export type { QuizSessionProps } from "./pages/quiz-session.tsx";

export { HomePage } from "./pages/home-page.tsx";
export type { HomePageProps } from "./pages/home-page.tsx";

export { SetPage } from "./pages/set-page.tsx";
export type { SetPageProps } from "./pages/set-page.tsx";
