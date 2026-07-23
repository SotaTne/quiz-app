import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadQuestionSets } from "@quiz/core/server";

// content/questions配下に実在しない問題(リネーム・削除済み)のattemptsを掃除する。
// `id`はセットをまたいで一意なので、現存する全idの集合に含まれない行はゴミとみなせる。
// `pnpm cleanup`(ローカル)/`pnpm cleanup:remote`(本番D1)から呼ぶ。

const CONTENT_DIR = "./content/questions";

function main(): void {
  const target = process.argv.includes("--remote") ? "--remote" : "--local";

  const result = loadQuestionSets(CONTENT_DIR);
  if (!result.ok) {
    console.error(`問題データの検証に失敗しました:\n${result.errors.join("\n")}`);
    process.exit(1);
  }

  const validIds = new Set<string>();
  for (const set of result.data) {
    for (const question of set.questions) validIds.add(question.id);
  }

  // 誤って全件削除してしまう事故を防ぐ(content読み込みに問題があるだけで0件になるケースがあるため)。
  if (validIds.size === 0) {
    console.log("有効な問題が1件もないため、誤削除防止のためクリーンアップを中止しました。");
    return;
  }

  const idList = [...validIds].map((id) => `'${id.replace(/'/g, "''")}'`).join(", ");
  const sql = `DELETE FROM attempts WHERE question_id NOT IN (${idList});`;

  const dir = mkdtempSync(join(tmpdir(), "quiz-cleanup-"));
  const sqlPath = join(dir, "cleanup.sql");
  writeFileSync(sqlPath, sql);

  execFileSync("wrangler", ["d1", "execute", "DB", target, "--file", sqlPath], { stdio: "inherit" });
  console.log(`クリーンアップ完了(${target}): 現存する${validIds.size}問以外の回答履歴を削除しました。`);
}

main();
