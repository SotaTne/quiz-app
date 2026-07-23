// core.attempts + better-authが必要とするテーブルを1つにまとめてre-exportする。
// マイグレーション履歴は(drizzle.config.tsがここをschemaとして参照するため)これ1つだけになる。
export { attempts } from "@quiz/core/schema";
export { account, session, user, verification } from "@quiz/auth";
