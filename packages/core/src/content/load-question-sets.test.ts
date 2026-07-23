import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadQuestionSets } from "./load-question-sets.ts";

let contentDir: string;

beforeEach(() => {
  contentDir = mkdtempSync(join(tmpdir(), "quiz-load-sets-"));
});

afterEach(() => {
  rmSync(contentDir, { recursive: true, force: true });
});

function writeSet(relativePath: string, markdown: string): void {
  const filePath = join(contentDir, relativePath);
  mkdirSync(join(filePath, ".."), { recursive: true });
  writeFileSync(filePath, markdown);
}

describe("loadQuestionSets", () => {
  it("フラットな複数の.mdファイルをQuestionSet[]に変換する", () => {
    writeSet("set1.md", "| id | question | answer |\n|----|----------|--------|\n| a | q1 | x |\n");
    writeSet("set2.md", "| id | question | answer |\n|----|----------|--------|\n| b | q2 | y |\n");

    const result = loadQuestionSets(contentDir);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.map((set) => set.id).sort()).toEqual(["set1", "set2"]);
  });

  it("サブディレクトリのファイルは階層を保ったsetIdになる", () => {
    writeSet("english/part1.md", "| id | question | answer |\n|----|----------|--------|\n| a | q1 | x |\n");

    const result = loadQuestionSets(contentDir);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data[0]?.id).toBe("english/part1");
  });

  it("いずれかのファイルが不正な場合はok:falseでエラーを返す", () => {
    writeSet("broken.md", "| id | question | answer |\n|----|----------|--------|\n| a |  |  |\n");

    const result = loadQuestionSets(contentDir);

    expect(result.ok).toBe(false);
  });

  it("同じidが別ファイルにまたがって重複している場合はエラーにする(全ファイル横断チェック)", () => {
    writeSet("set1.md", "| id | question | answer |\n|----|----------|--------|\n| dup | q1 | x |\n");
    writeSet("set2.md", "| id | question | answer |\n|----|----------|--------|\n| dup | q2 | y |\n");

    const result = loadQuestionSets(contentDir);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]).toMatch(/dup/);
  });

  it(".mdファイルが1つもない場合は空配列を返す", () => {
    const result = loadQuestionSets(contentDir);

    expect(result).toEqual({ ok: true, data: [] });
  });
});
