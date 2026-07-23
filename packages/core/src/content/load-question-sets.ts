import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { QuestionSet } from "../domain/question";
import { buildQuestionSet } from "./build-question-set";
import { deriveSetId } from "./derive-set-id";

export type LoadQuestionSetsResult = { ok: true; data: QuestionSet[] } | { ok: false; errors: string[] };

function findMarkdownFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) return findMarkdownFiles(fullPath);
    return entry.name.endsWith(".md") ? [fullPath] : [];
  });
}

/**
 * `contentDir`配下の`**​/*.md`を再帰的に読み込み、`QuestionSet[]`に変換する。
 * `id`の重複は(CIのバリデーションと同じく)全ファイル横断でチェックする。
 */
export function loadQuestionSets(contentDir: string): LoadQuestionSetsResult {
  const errors: string[] = [];
  const sets: QuestionSet[] = [];
  const seenQuestionIds = new Set<string>();

  for (const filePath of findMarkdownFiles(contentDir)) {
    const setId = deriveSetId(contentDir, filePath);
    const result = buildQuestionSet({ setId, markdown: readFileSync(filePath, "utf-8") });

    if (!result.ok) {
      errors.push(...result.errors);
      continue;
    }

    for (const question of result.data.questions) {
      if (seenQuestionIds.has(question.id)) {
        errors.push(`id "${question.id}" が複数のセットにまたがって重複しています(set: "${setId}")`);
        continue;
      }
      seenQuestionIds.add(question.id);
    }

    sets.push(result.data);
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true, data: sets };
}
