import { describe, expect, it } from "vitest";
import { parseFrontmatter } from "./parse-frontmatter";

describe("parseFrontmatter", () => {
  it("splits a leading --- block into key/value pairs and returns the rest as body", () => {
    const input = `---
title: JavaScript基礎
---

| id | question |`;

    const result = parseFrontmatter(input);

    expect(result.frontmatter).toEqual({ title: "JavaScript基礎" });
    expect(result.body.trim()).toBe("| id | question |");
  });

  it("returns an empty frontmatter object when there is no --- block", () => {
    const result = parseFrontmatter("| id | question |");

    expect(result.frontmatter).toEqual({});
    expect(result.body).toBe("| id | question |");
  });

  it("ignores blank lines inside the frontmatter block", () => {
    const input = `---
title: Foo

---
body`;

    const result = parseFrontmatter(input);

    expect(result.frontmatter).toEqual({ title: "Foo" });
  });
});
