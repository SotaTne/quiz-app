import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadPapers } from "./load-papers.ts";

let contentDir: string;

beforeEach(() => {
  contentDir = mkdtempSync(join(tmpdir(), "quiz-papers-"));
});

afterEach(() => {
  rmSync(contentDir, { recursive: true, force: true });
});

describe("loadPapers", () => {
  it("contentDirが存在しない場合は空のカンペ一覧を返す", () => {
    const result = loadPapers(join(contentDir, "missing"));

    expect(result).toEqual({ ok: true, data: [] });
  });

  it("Markdownとmmdを再帰的に読み込み、orderとtitleで並べる", () => {
    mkdirSync(join(contentDir, "nested"));
    writeFileSync(join(contentDir, "later.md"), "---\ntitle: B\norder: 20\n---\nB");
    writeFileSync(join(contentDir, "nested", "first.mmd"), "---\ntitle: A\norder: 10\n---\ngraph TD\nA-->B");

    const result = loadPapers(contentDir);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.map(({ id, title }) => ({ id, title }))).toEqual([
      { id: "nested/first", title: "A" },
      { id: "later", title: "B" },
    ]);
  });

  it("不正なファイルがあればエラーを集約する", () => {
    writeFileSync(join(contentDir, "broken.md"), "本文だけ");

    const result = loadPapers(contentDir);

    expect(result).toEqual({
      ok: false,
      errors: ['paper "broken" is missing required frontmatter "title"'],
    });
  });
});
