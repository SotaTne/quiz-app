import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Public schema for the `attempts` table (see SPEC.md 3.6). `db` imports this to
 * generate migrations; production reads/writes go through `createStore` (./store.ts).
 */
export const attempts = sqliteTable("attempts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  questionId: text("question_id").notNull(),
  mode: text("mode", { enum: ["quiz", "flashcard"] }).notNull(),
  isCorrect: integer("is_correct", { mode: "boolean" }).notNull(),
  answeredAt: integer("answered_at", { mode: "timestamp" }).notNull(),
});
