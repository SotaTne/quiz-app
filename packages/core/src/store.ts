import { and, desc, eq } from "drizzle-orm";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import type { Mode } from "./domain/attempt";
import { attempts } from "./schema";

/**
 * ドライバに依存しない型。`drizzle-orm/d1`(本番、Cloudflare D1)と
 * `drizzle-orm/better-sqlite3`(テスト、store.test.ts参照)のどちらでも満たせる。SQLite方言は共通。
 */
export type Database = BaseSQLiteDatabase<"sync" | "async", unknown, { attempts: typeof attempts }>;

export type RecordAttemptInput = {
  id: string;
  userId: string;
  questionId: string;
  mode: Mode;
  isCorrect: boolean;
};

export type Store = {
  /** `id`で冪等(INSERT OR IGNORE) — 再送しても安全。 */
  recordAttempt(input: RecordAttemptInput): Promise<void>;
  /** questionIdごとに1件: そのuser+modeにおける最新の回答(同時刻はidの降順でタイブレーク)。 */
  listLatestAttempts(userId: string, mode: Mode): Promise<Map<string, { isCorrect: boolean }>>;
};

export function createStore(db: Database): Store {
  return {
    async recordAttempt(input) {
      await db
        .insert(attempts)
        .values({ ...input, answeredAt: new Date() })
        .onConflictDoNothing({ target: attempts.id });
    },

    async listLatestAttempts(userId, mode) {
      const rows = await db
        .select()
        .from(attempts)
        .where(and(eq(attempts.userId, userId), eq(attempts.mode, mode)))
        .orderBy(desc(attempts.answeredAt), desc(attempts.id));

      const latestByQuestion = new Map<string, { isCorrect: boolean }>();
      for (const row of rows) {
        if (!latestByQuestion.has(row.questionId)) {
          latestByQuestion.set(row.questionId, { isCorrect: row.isCorrect });
        }
      }
      return latestByQuestion;
    },
  };
}
