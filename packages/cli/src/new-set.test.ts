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
});
