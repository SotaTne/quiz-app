import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "./create-app";

let workDir: string;

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), "quiz-cli-test-"));
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
});

describe("createApp", () => {
  it("テンプレート一式を新しいディレクトリにコピーする", () => {
    const target = join(workDir, "my-app");

    createApp(target, "my-app");

    expect(existsSync(join(target, "package.json"))).toBe(true);
    expect(existsSync(join(target, "vite.config.ts"))).toBe(true);
    expect(existsSync(join(target, "app/routes.ts"))).toBe(true);
    expect(existsSync(join(target, "wrangler.toml"))).toBe(true);
    expect(existsSync(join(target, "content/questions/example.md"))).toBe(true);
  });

  it("{{appName}}のプレースホルダーを実際のアプリ名に置き換える", () => {
    const target = join(workDir, "my-app");

    createApp(target, "my-app");

    const pkg = JSON.parse(readFileSync(join(target, "package.json"), "utf-8"));
    expect(pkg.name).toBe("my-app");

    const wranglerToml = readFileSync(join(target, "wrangler.toml"), "utf-8");
    expect(wranglerToml).toContain("my-app-db");
    expect(wranglerToml).not.toContain("{{appName}}");
  });

  it("既にディレクトリが存在する場合はエラーにして上書きしない", () => {
    const target = join(workDir, "my-app");
    createApp(target, "my-app");

    expect(() => createApp(target, "my-app")).toThrow();
  });
});
