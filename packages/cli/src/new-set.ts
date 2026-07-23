import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const TEMPLATE = (setName: string) => `---
title: ${setName}
---

| id | question | answer | explanation |
|----|----------|--------|-------------|
`;

/** `quiz new <setName>` の実処理。`contentDir`配下に`<setName>.md`の雛形を生成する。 */
export function createQuestionSet(contentDir: string, setName: string): string {
  mkdirSync(contentDir, { recursive: true });

  const filePath = join(contentDir, `${setName}.md`);
  if (existsSync(filePath)) {
    throw new Error(`ファイルがすでに存在します: ${filePath}`);
  }

  writeFileSync(filePath, TEMPLATE(setName));
  return filePath;
}
