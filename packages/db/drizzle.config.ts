import type { Config } from "drizzle-kit";

// drizzle-kit generateだけを使う(migrateは使わない)。実際の適用はwrangler d1 migrations apply
// 経由でappが手動実行する(SPEC.md 4章参照、CI/CDでの自動適用はしない)。
export default {
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
} satisfies Config;
