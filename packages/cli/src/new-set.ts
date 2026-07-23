import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

const TEMPLATE = (title: string) => `---
title: ${title}
---

| id | question | answer | explanation |
|----|----------|--------|-------------|
`;

/**
 * `quiz new <setName>` の実処理。`contentDir`配下に`<setName>.md`の雛形を生成する。
 * `setName`は`english/part1`のようにサブディレクトリを含んでよく、その場合は階層ごと自動生成する
 * (`content/questions/english/part1.md` = setId "english/part1")。
 */
export function createQuestionSet(contentDir: string, setName: string): string {
  if (setName.startsWith("/") || setName.split("/").includes("..")) {
    throw new Error(`不正なセット名です: ${setName}`);
  }

  const filePath = join(contentDir, `${setName}.md`);
  if (existsSync(filePath)) {
    throw new Error(`ファイルがすでに存在します: ${filePath}`);
  }

  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, TEMPLATE(basename(setName)));
  return filePath;
}
