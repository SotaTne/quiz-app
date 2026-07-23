import { describe, expect, it } from "vitest";
import { deriveSetId } from "./derive-set-id.ts";

describe("deriveSetId", () => {
  it("フラットなファイルはファイル名(拡張子なし)をsetIdにする", () => {
    expect(deriveSetId("content/questions", "content/questions/react-hooks.md")).toBe("react-hooks");
  });

  it("サブディレクトリのファイルは階層を保ったsetIdにする(例: english/part1)", () => {
    expect(deriveSetId("content/questions", "content/questions/english/part1.md")).toBe("english/part1");
  });

  it("複数階層のサブディレクトリにも対応する", () => {
    expect(deriveSetId("content/questions", "content/questions/a/b/c.md")).toBe("a/b/c");
  });
});
