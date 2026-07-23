import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { quizContentPlugin } from "./index.ts";

type ResolveIdFn = (id: string) => string | undefined;
type LoadFn = (id: string) => string | undefined;

let contentDir: string;

beforeEach(() => {
  contentDir = mkdtempSync(join(tmpdir(), "quiz-vite-plugin-"));
});

afterEach(() => {
  rmSync(contentDir, { recursive: true, force: true });
});

describe("quizContentPlugin", () => {
  it("resolveIdはvirtual:quiz-contentだけを解決する", () => {
    const plugin = quizContentPlugin({ contentDir });
    const resolveId = plugin.resolveId as ResolveIdFn;

    expect(resolveId("virtual:quiz-content")).toBe("\0virtual:quiz-content");
    expect(resolveId("./something-else")).toBeUndefined();
  });

  it("loadは解決済みIDに対してQuestionSet[]を含むモジュールコードを生成する", () => {
    writeFileSync(
      join(contentDir, "set1.md"),
      "---\ntitle: Set1\n---\n\n| id | question | answer |\n|----|----------|--------|\n| a | q | b |\n",
    );

    const plugin = quizContentPlugin({ contentDir });
    const load = plugin.load as LoadFn;

    const code = load("\0virtual:quiz-content");
    expect(code).toContain('"id":"set1"');
    expect(code).toContain('"id":"a"');
  });

  it("未解決のIDに対してはundefinedを返す(他プラグインに委ねる)", () => {
    const plugin = quizContentPlugin({ contentDir });
    const load = plugin.load as LoadFn;

    expect(load("some-other-module")).toBeUndefined();
  });

  it("問題データが不正な場合はビルドエラーとしてthrowする", () => {
    writeFileSync(join(contentDir, "broken.md"), "| id | question | answer |\n|----|----------|--------|\n| a |  |  |\n");

    const plugin = quizContentPlugin({ contentDir });
    const load = plugin.load as LoadFn;

    expect(() => load("\0virtual:quiz-content")).toThrow();
  });
});
