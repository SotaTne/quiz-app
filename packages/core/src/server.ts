// サーバー専用(node:fs/node:path/drizzle-orm等に触れる)のバレル。"@quiz/core/server"としてimportする。
// route定義ファイルのloader/action、Workerのエントリからのみ使うこと(クライアントバンドルに混ぜない)。

export { buildQuestionSet } from "./content/build-question-set.ts";
export type { BuildQuestionSetResult } from "./content/build-question-set.ts";

export { deriveSetId } from "./content/derive-set-id.ts";

export { loadQuestionSets } from "./content/load-question-sets.ts";
export type { LoadQuestionSetsResult } from "./content/load-question-sets.ts";

export { attempts } from "./schema.ts";

export { createStore } from "./store.ts";
export type { Database, RecordAttemptInput, Store } from "./store.ts";

export { loadHomeData } from "./pages/load-home-data.ts";
export type { HomeData, LoadHomeDataInput } from "./pages/load-home-data.ts";

export { loadSetData } from "./pages/load-set-data.ts";
export type { LoadSetDataInput, SetData } from "./pages/load-set-data.ts";

export { submitAnswer } from "./actions/submit-answer.ts";
export type { AuthLike, SubmitAnswerDeps } from "./actions/submit-answer.ts";

export { parseSubmitAnswerInput } from "./actions/parse-submit-answer-input.ts";
export type { ParseSubmitAnswerInputResult, SubmitAnswerInput } from "./actions/parse-submit-answer-input.ts";
