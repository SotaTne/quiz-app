import BetterSqlite3 from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { attempts } from "./schema.ts";
import { createStore, type Database, type Store } from "./store.ts";

// schema.tsの`attempts`テーブルを模したもの。仮想Cloudflare Workerではなく
// better-sqlite3を使うのは、D1と同じSQLite方言でwrangler/Miniflareのセットアップが不要かつ
// Storeが発行するSQLの正しさを検証するには十分だから。
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
  it("回答を記録し、その問題の最新の回答として返す", async () => {
    await store.recordAttempt({ id: "a1", userId: "u1", questionId: "q1", mode: "quiz", isCorrect: true });

    const latest = await store.listLatestAttempts("u1", "quiz");

    expect(latest.get("q1")).toEqual({ isCorrect: true });
  });

  it("冪等: 同じidを再送しても元の記録を上書きしない", async () => {
    await store.recordAttempt({ id: "a1", userId: "u1", questionId: "q1", mode: "quiz", isCorrect: true });
    await store.recordAttempt({ id: "a1", userId: "u1", questionId: "q1", mode: "quiz", isCorrect: false });

    const latest = await store.listLatestAttempts("u1", "quiz");

    expect(latest.get("q1")).toEqual({ isCorrect: true });
  });

  it("問題ごとに最新の回答(answeredAtの降順)だけを見る", async () => {
    const db = drizzle(sqlite) as unknown as Database;
    await db.insert(attempts).values([
      { id: "old", userId: "u1", questionId: "q1", mode: "quiz", isCorrect: false, answeredAt: new Date(1000) },
      { id: "new", userId: "u1", questionId: "q1", mode: "quiz", isCorrect: true, answeredAt: new Date(2000) },
    ]);

    const latest = await store.listLatestAttempts("u1", "quiz");

    expect(latest.get("q1")).toEqual({ isCorrect: true });
  });

  it("同時刻の場合はidの降順でタイブレークする", async () => {
    const db = drizzle(sqlite) as unknown as Database;
    const sameTime = new Date(1000);
    await db.insert(attempts).values([
      { id: "a", userId: "u1", questionId: "q1", mode: "quiz", isCorrect: false, answeredAt: sameTime },
      { id: "b", userId: "u1", questionId: "q1", mode: "quiz", isCorrect: true, answeredAt: sameTime },
    ]);

    const latest = await store.listLatestAttempts("u1", "quiz");

    // 辞書順で "b" > "a" なので、タイブレークでは "b" が勝つ。
    expect(latest.get("q1")).toEqual({ isCorrect: true });
  });

  it("同じ問題でもquizとflashcardの回答は別々に扱う", async () => {
    await store.recordAttempt({ id: "a1", userId: "u1", questionId: "q1", mode: "quiz", isCorrect: true });
    await store.recordAttempt({ id: "a2", userId: "u1", questionId: "q1", mode: "flashcard", isCorrect: false });

    expect((await store.listLatestAttempts("u1", "quiz")).get("q1")).toEqual({ isCorrect: true });
    expect((await store.listLatestAttempts("u1", "flashcard")).get("q1")).toEqual({ isCorrect: false });
  });

  it("ユーザー間で回答が混ざらない", async () => {
    await store.recordAttempt({ id: "a1", userId: "u1", questionId: "q1", mode: "quiz", isCorrect: true });
    await store.recordAttempt({ id: "a2", userId: "u2", questionId: "q1", mode: "quiz", isCorrect: false });

    expect((await store.listLatestAttempts("u1", "quiz")).get("q1")).toEqual({ isCorrect: true });
    expect((await store.listLatestAttempts("u2", "quiz")).get("q1")).toEqual({ isCorrect: false });
  });

  describe("listAccuracy", () => {
    it("全履歴から正答数/総回答数を集計する(苦手問題判定に使う)", async () => {
      await store.recordAttempt({ id: "a1", userId: "u1", questionId: "q1", mode: "quiz", isCorrect: false });
      await store.recordAttempt({ id: "a2", userId: "u1", questionId: "q1", mode: "quiz", isCorrect: false });
      await store.recordAttempt({ id: "a3", userId: "u1", questionId: "q1", mode: "quiz", isCorrect: true });

      const accuracy = await store.listAccuracy("u1", "quiz");

      expect(accuracy.get("q1")).toEqual({ total: 3, correct: 1 });
    });

    it("同じ問題でもquizとflashcardの履歴は別々に集計する", async () => {
      await store.recordAttempt({ id: "a1", userId: "u1", questionId: "q1", mode: "quiz", isCorrect: true });
      await store.recordAttempt({ id: "a2", userId: "u1", questionId: "q1", mode: "flashcard", isCorrect: false });

      expect((await store.listAccuracy("u1", "quiz")).get("q1")).toEqual({ total: 1, correct: 1 });
      expect((await store.listAccuracy("u1", "flashcard")).get("q1")).toEqual({ total: 1, correct: 0 });
    });

    it("一度も回答していない問題はエントリを持たない", async () => {
      await store.recordAttempt({ id: "a1", userId: "u1", questionId: "q1", mode: "quiz", isCorrect: true });

      const accuracy = await store.listAccuracy("u1", "quiz");

      expect(accuracy.has("q2")).toBe(false);
    });
  });
});
