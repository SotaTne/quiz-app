import { describe, expect, it } from "vitest";
import { buildPaper } from "./build-paper.ts";

describe("buildPaper", () => {
  it("frontmatterとMarkdown本文からPaperを組み立てる", () => {
    const result = buildPaper({
      paperId: "software-engineering/final",
      markdown: `---
title: ソフトウェア工学
description: 期末試験用
order: 20
---

# 開発モデル

$E = mc^2$

\`\`\`mermaid
graph TD
  A --> B
\`\`\`
`,
    });

    expect(result).toEqual({
      ok: true,
      data: {
        id: "software-engineering/final",
        title: "ソフトウェア工学",
        description: "期末試験用",
        order: 20,
        markdown: expect.stringContaining("# 開発モデル"),
      },
    });
  });

  it("titleがない場合はエラーにする", () => {
    const result = buildPaper({ paperId: "untitled", markdown: "# 本文" });

    expect(result).toEqual({ ok: false, errors: ['paper "untitled" is missing required frontmatter "title"'] });
  });

  it("orderが数値でない場合はエラーにする", () => {
    const result = buildPaper({
      paperId: "invalid-order",
      markdown: "---\ntitle: 無効\norder: first\n---\n本文",
    });

    expect(result).toEqual({ ok: false, errors: ['paper "invalid-order" has invalid "order": "first"'] });
  });
});
