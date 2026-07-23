import { cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// packages/templates/defaultは実在のワークスペースパッケージ(@quiz/core等に実際に依存し、
// 自身の型が通ることを保証できる)。単なる文字列テンプレート集ではない。
const TEMPLATE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "templates", "default");

const EXCLUDED = new Set(["node_modules", "dist", ".wrangler", "tsconfig.tsbuildinfo"]);

/** `quiz create <appName>` の実処理。テンプレート一式を`targetDir`にコピーし、アプリ名を反映する。 */
export function createApp(targetDir: string, appName: string): void {
  if (existsSync(targetDir)) {
    throw new Error(`ディレクトリがすでに存在します: ${targetDir}`);
  }

  cpSync(TEMPLATE_DIR, targetDir, {
    recursive: true,
    filter: (src) => !EXCLUDED.has(src.split("/").pop() ?? ""),
  });

  setPackageName(targetDir, appName);
  replaceWranglerPlaceholder(targetDir, appName);
}

function setPackageName(dir: string, appName: string): void {
  const pkgPath = join(dir, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  pkg.name = appName;
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

function replaceWranglerPlaceholder(dir: string, appName: string): void {
  const wranglerPath = join(dir, "wrangler.toml");
  const content = readFileSync(wranglerPath, "utf-8")
    .replaceAll("{{appName}}", appName)
    // テンプレート単体でも`wrangler`の名前バリデーションを通すため、topレベルのnameは
    // ダミー値("quiz-app-template")で持っている。ここで実際のアプリ名に差し替える。
    .replace(/^name = ".*"$/m, `name = "${appName}"`);
  writeFileSync(wranglerPath, content);
}
