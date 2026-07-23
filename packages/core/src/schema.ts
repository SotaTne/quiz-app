import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * 公開スキーマ: `attempts`テーブル(SPEC.md 3.6参照)。`db`パッケージがこれをimportし、
 * 共有D1のマイグレーション履歴を1つにまとめる。本番の読み書きは`createStore`(./store.ts)経由で行う。
 *
 * `userId`はbetter-authの`user.id`への外部キーを張らない。単一ユーザーの個人用アプリのため、
 * DB側で参照整合性を強制するメリットが薄く、そのために`core`が`auth`のテーブル定義に
 * 依存する複雑さの方が見合わない(questionIdも同様の理由でFK制約なし)。
 */
export const attempts = sqliteTable("attempts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  questionId: text("question_id").notNull(),
  mode: text("mode", { enum: ["quiz", "flashcard"] }).notNull(),
  isCorrect: integer("is_correct", { mode: "boolean" }).notNull(),
  answeredAt: integer("answered_at", { mode: "timestamp" }).notNull(),
});
