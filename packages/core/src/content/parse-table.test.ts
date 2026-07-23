import { describe, expect, it } from "vitest";
import { parseTable } from "./parse-table";

describe("parseTable", () => {
  it("parses a markdown table into row objects keyed by header", () => {
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

  it("returns an empty array when there is no table", () => {
    expect(parseTable("just some text")).toEqual([]);
  });

  it("ignores content before the table", () => {
    const markdown = `some intro text

| id | answer |
|----|--------|
| a | b |`;

    expect(parseTable(markdown)).toEqual([{ id: "a", answer: "b" }]);
  });

  it("accepts bare rows without leading/trailing pipes", () => {
    const markdown = `id | answer
---|---
a | b`;

    expect(parseTable(markdown)).toEqual([{ id: "a", answer: "b" }]);
  });

  it("stops at the first blank line after the table", () => {
    const markdown = `| id | answer |
|----|--------|
| a | b |

some trailing note that happens to contain | a pipe`;

    expect(parseTable(markdown)).toEqual([{ id: "a", answer: "b" }]);
  });
});
