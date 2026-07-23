import { createStore, type Database, type Store } from "./store";

export type QuizConfig = {
  contentDir: string;
  store: Store;
};

export type DefineQuizConfigInput = {
  contentDir: string;
  db: Database;
  // `auth` is wired in once @quiz/auth exists; core will read the session from it
  // directly (see SPEC.md 1: core is allowed to depend on auth).
};

/** Assembles the pieces an `app` provides (a DB connection, later auth) into one config. */
export function defineQuizConfig(input: DefineQuizConfigInput): QuizConfig {
  return {
    contentDir: input.contentDir,
    store: createStore(input.db),
  };
}
