import { createAuth } from "@quiz/auth";
import BetterSqlite3 from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { describe, expect, it } from "vitest";
import { defineQuizConfig } from "./config";
import type { Database } from "./store";

const CREATE_ATTEMPTS_TABLE = `
  create table attempts (
    id text primary key,
    user_id text not null,
    question_id text not null,
    mode text not null,
    is_correct integer not null,
    answered_at integer not null
  )
`;

describe("defineQuizConfig", () => {
  it("dbからStoreを組み立て、authはそのまま設定に含める", () => {
    const sqlite = new BetterSqlite3(":memory:");
    sqlite.exec(CREATE_ATTEMPTS_TABLE);
    const db = drizzle(sqlite) as unknown as Database;
    const auth = createAuth({
      db: sqlite,
      secret: "test-secret",
      baseURL: "http://localhost:3000",
      allowedEmails: ["allow@example.com"],
      google: { clientId: "test-client-id", clientSecret: "test-client-secret" },
    });

    const config = defineQuizConfig({ contentDir: "./content/questions", db, auth });

    expect(config.contentDir).toBe("./content/questions");
    expect(config.auth).toBe(auth);
    expect(config.store.recordAttempt).toBeTypeOf("function");
    expect(config.store.listLatestAttempts).toBeTypeOf("function");
  });
});
