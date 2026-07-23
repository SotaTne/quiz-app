import { describe, expect, it } from "vitest";
import { parseFrontmatter } from "./parse-frontmatter.ts";

describe("parseFrontmatter", () => {
  it("先頭の---ブロックをkey/valueに分割し、残りをbodyとして返す", () => {
    const input = `---
title: JavaScript基礎
---

| id | question |`;

    const result = parseFrontmatter(input);

    expect(result.frontmatter).toEqual({ title: "JavaScript基礎" });
    expect(result.body.trim()).toBe("| id | question |");
  });

  it("---ブロックがない場合は空のfrontmatterを返す", () => {
    const result = parseFrontmatter("| id | question |");

    expect(result.frontmatter).toEqual({});
    expect(result.body).toBe("| id | question |");
  });

  it("frontmatterブロック内の空行を無視する", () => {
    const input = `---
title: Foo

---
body`;

    const result = parseFrontmatter(input);

    expect(result.frontmatter).toEqual({ title: "Foo" });
  });
});
