import type { Config } from "drizzle-kit";

// スキーマの定義自体は@quiz/dbが持つ(core.attempts + better-auth生成スキーマの統合、SPEC.md 4章)。
// マイグレーションファイルの実体はこのapp自身に閉じて持つ(migrations/はapp側のディレクトリ)。
export default {
  schema: "./node_modules/@quiz/db/src/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
} satisfies Config;
