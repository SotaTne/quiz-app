import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createQuestionSet } from "./new-set";

let contentDir: string;

beforeEach(() => {
  contentDir = mkdtempSync(join(tmpdir(), "quiz-cli-content-"));
});

afterEach(() => {
  rmSync(contentDir, { recursive: true, force: true });
});

describe("createQuestionSet", () => {
  it("frontmatter+空テーブルのMDファイルを生成する", () => {
    const filePath = createQuestionSet(contentDir, "react-hooks");

    expect(existsSync(filePath)).toBe(true);
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("title: react-hooks");
    expect(content).toContain("| id | question | answer | explanation |");
  });

  it("既に同名のファイルがある場合はエラーにして上書きしない", () => {
    createQuestionSet(contentDir, "react-hooks");

    expect(() => createQuestionSet(contentDir, "react-hooks")).toThrow();
  });

  it("サブディレクトリを含むセット名は階層を自動生成する(例: english/part1)", () => {
    const filePath = createQuestionSet(contentDir, "english/part1");

    expect(filePath).toBe(join(contentDir, "english", "part1.md"));
    expect(existsSync(filePath)).toBe(true);
    // titleはフルパスではなく最後の階層(part1)を使う
    expect(readFileSync(filePath, "utf-8")).toContain("title: part1");
  });

  it("先頭が/のセット名や..を含むセット名は拒否する", () => {
    expect(() => createQuestionSet(contentDir, "/etc/passwd")).toThrow();
    expect(() => createQuestionSet(contentDir, "../outside")).toThrow();
  });
});
