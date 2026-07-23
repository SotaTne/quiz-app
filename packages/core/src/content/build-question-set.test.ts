import { describe, expect, it } from "vitest";
import { buildQuestionSet } from "./build-question-set";

const valid = `---
title: JavaScript基礎
---

| id | question | answer | explanation |
|----|----------|--------|-------------|
| js-001 | typeof null? | object | quirk |
| js-002 | 1+1? | 2 |  |`;

describe("buildQuestionSet", () => {
  it("frontmatter+テーブルのmarkdownからQuestionSetを構築する", () => {
    const result = buildQuestionSet({ setId: "javascript-basics", markdown: valid });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toEqual({
      id: "javascript-basics",
      title: "JavaScript基礎",
      questions: [
        { id: "js-001", question: "typeof null?", answer: "object", explanation: "quirk" },
        { id: "js-002", question: "1+1?", answer: "2", explanation: null },
      ],
    });
  });

  it("frontmatterにtitleがない場合はsetIdをtitleとして使う", () => {
    const markdown = valid.replace("title: JavaScript基礎\n", "");
    const result = buildQuestionSet({ setId: "javascript-basics", markdown });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.title).toBe("javascript-basics");
  });

  it("必須列が欠けている行があると失敗する", () => {
    const markdown = `| id | question | answer |
|----|----------|--------|
| js-001 | typeof null? |  |`;

    const result = buildQuestionSet({ setId: "broken", markdown });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]).toMatch(/answer/);
  });

  it("テーブルに行が1つもないと失敗する", () => {
    const result = buildQuestionSet({ setId: "empty", markdown: "no table here" });

    expect(result.ok).toBe(false);
  });

  it("同じセット内に同じidが2回出てくると失敗する", () => {
    const markdown = `| id | question | answer |
|----|----------|--------|
| dup | q1 | a1 |
| dup | q2 | a2 |`;

    const result = buildQuestionSet({ setId: "dup-set", markdown });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]).toMatch(/dup/);
  });
});
