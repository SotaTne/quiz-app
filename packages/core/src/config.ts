import { createStore, type Database, type Store } from "./store";

export type QuizConfig = {
  contentDir: string;
  store: Store;
};

export type DefineQuizConfigInput = {
  contentDir: string;
  db: Database;
  // authは@quiz/authの実装が揃い次第ここに追加する。coreはそこから直接セッションを読む
  // (SPEC.md 1章: coreがauthに依存すること自体は許容している)。
};

/** `app`が用意するもの(DB接続、後でauthも)を1つの設定にまとめる。 */
export function defineQuizConfig(input: DefineQuizConfigInput): QuizConfig {
  return {
    contentDir: input.contentDir,
    store: createStore(input.db),
  };
}
