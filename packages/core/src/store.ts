import { and, desc, eq } from "drizzle-orm";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import type { Mode } from "./domain/attempt";
import { attempts } from "./schema";

/**
 * Driver-agnostic handle: satisfied by both `drizzle-orm/d1` (production, Cloudflare D1)
 * and `drizzle-orm/better-sqlite3` (tests, see store.test.ts). Same SQLite dialect either way.
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
  /** Idempotent by `id` (INSERT OR IGNORE) — safe to call again after a retry. */
  recordAttempt(input: RecordAttemptInput): Promise<void>;
  /** One entry per questionId: the most recent attempt for that user+mode (ties broken by id desc). */
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
