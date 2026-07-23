import { describe, expect, it } from "vitest";
import { parseTable } from "./parse-table";

describe("parseTable", () => {
  it("markdownテーブルをヘッダー名をキーにした行オブジェクトに変換する", () => {
    const markdown = `| id | question | answer | explanation |
|----|----------|--------|-------------|
| js-001 | typeof null? | object | quirk |
| js-002 | 1+1? | 2 |  |`;

    const rows = parseTable(markdown);

    expect(rows).toEqual([
      { id: "js-001", question: "typeof null?", answer: "object", explanation: "quirk" },
      { id: "js-002", question: "1+1?", answer: "2", explanation: "" },
    ]);
  });

  it("テーブルがない場合は空配列を返す", () => {
    expect(parseTable("just some text")).toEqual([]);
  });

  it("テーブルより前にある文章は無視する", () => {
    const markdown = `some intro text

| id | answer |
|----|--------|
| a | b |`;

    expect(parseTable(markdown)).toEqual([{ id: "a", answer: "b" }]);
  });

  it("先頭/末尾に|がない素の行も受け付ける", () => {
    const markdown = `id | answer
---|---
a | b`;

    expect(parseTable(markdown)).toEqual([{ id: "a", answer: "b" }]);
  });

  it("テーブルの後の最初の空行で読み取りを止める", () => {
    const markdown = `| id | answer |
|----|--------|
| a | b |

some trailing note that happens to contain | a pipe`;

    expect(parseTable(markdown)).toEqual([{ id: "a", answer: "b" }]);
  });
});
