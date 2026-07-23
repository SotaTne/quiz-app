import type { createAuth } from "@quiz/auth";
import { createStore, type Database, type Store } from "./store";

export type Auth = ReturnType<typeof createAuth>;

export type QuizConfig = {
  contentDir: string;
  store: Store;
  auth: Auth;
};

export type DefineQuizConfigInput = {
  contentDir: string;
  db: Database;
  auth: Auth;
};

/** `app`が用意するもの(DB接続、`@quiz/auth`が作ったAuthインスタンス)を1つの設定にまとめる。 */
export function defineQuizConfig(input: DefineQuizConfigInput): QuizConfig {
  return {
    contentDir: input.contentDir,
    store: createStore(input.db),
    auth: input.auth,
  };
}
