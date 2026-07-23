import BetterSqlite3 from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { attempts } from "./schema";
import { createStore, type Database, type Store } from "./store";

// Mirrors schema.ts's `attempts` table. better-sqlite3 is used instead of a virtual
// Cloudflare Worker because it's the same SQLite dialect D1 uses and needs no
// wrangler/Miniflare setup — enough to verify the Store's SQL is correct.
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

let sqlite: BetterSqlite3.Database;
let store: Store;

beforeEach(() => {
  sqlite = new BetterSqlite3(":memory:");
  sqlite.exec(CREATE_ATTEMPTS_TABLE);
  const db = drizzle(sqlite) as unknown as Database;
  store = createStore(db);
});

afterEach(() => {
  sqlite.close();
});

describe("createStore", () => {
  it("records an attempt and returns it as the latest for that question", async () => {
    await store.recordAttempt({ id: "a1", userId: "u1", questionId: "q1", mode: "quiz", isCorrect: true });

    const latest = await store.listLatestAttempts("u1", "quiz");

    expect(latest.get("q1")).toEqual({ isCorrect: true });
  });

  it("is idempotent: re-sending the same id does not overwrite the original record", async () => {
    await store.recordAttempt({ id: "a1", userId: "u1", questionId: "q1", mode: "quiz", isCorrect: true });
    await store.recordAttempt({ id: "a1", userId: "u1", questionId: "q1", mode: "quiz", isCorrect: false });

    const latest = await store.listLatestAttempts("u1", "quiz");

    expect(latest.get("q1")).toEqual({ isCorrect: true });
  });

  it("only considers the most recent attempt per question (answeredAt desc)", async () => {
    const db = drizzle(sqlite) as unknown as Database;
    await db.insert(attempts).values([
      { id: "old", userId: "u1", questionId: "q1", mode: "quiz", isCorrect: false, answeredAt: new Date(1000) },
      { id: "new", userId: "u1", questionId: "q1", mode: "quiz", isCorrect: true, answeredAt: new Date(2000) },
    ]);

    const latest = await store.listLatestAttempts("u1", "quiz");

    expect(latest.get("q1")).toEqual({ isCorrect: true });
  });

  it("breaks same-timestamp ties by id desc", async () => {
    const db = drizzle(sqlite) as unknown as Database;
    const sameTime = new Date(1000);
    await db.insert(attempts).values([
      { id: "a", userId: "u1", questionId: "q1", mode: "quiz", isCorrect: false, answeredAt: sameTime },
      { id: "b", userId: "u1", questionId: "q1", mode: "quiz", isCorrect: true, answeredAt: sameTime },
    ]);

    const latest = await store.listLatestAttempts("u1", "quiz");

    // "b" > "a" lexicographically, so it wins the tie-break.
    expect(latest.get("q1")).toEqual({ isCorrect: true });
  });

  it("keeps quiz and flashcard attempts separate for the same question", async () => {
    await store.recordAttempt({ id: "a1", userId: "u1", questionId: "q1", mode: "quiz", isCorrect: true });
    await store.recordAttempt({ id: "a2", userId: "u1", questionId: "q1", mode: "flashcard", isCorrect: false });

    expect((await store.listLatestAttempts("u1", "quiz")).get("q1")).toEqual({ isCorrect: true });
    expect((await store.listLatestAttempts("u1", "flashcard")).get("q1")).toEqual({ isCorrect: false });
  });

  it("does not leak attempts between users", async () => {
    await store.recordAttempt({ id: "a1", userId: "u1", questionId: "q1", mode: "quiz", isCorrect: true });
    await store.recordAttempt({ id: "a2", userId: "u2", questionId: "q1", mode: "quiz", isCorrect: false });

    expect((await store.listLatestAttempts("u1", "quiz")).get("q1")).toEqual({ isCorrect: true });
    expect((await store.listLatestAttempts("u2", "quiz")).get("q1")).toEqual({ isCorrect: false });
  });
});
