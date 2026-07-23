import { attempts as coreAttempts } from "@quiz/core";
import { account as authAccount, session as authSession, user as authUser, verification as authVerification } from "@quiz/auth";
import { describe, expect, it } from "vitest";
import * as schema from "./schema";

// スキーマを再定義してしまうと、coreとdbで別々のテーブル定義が存在することになり、
// マイグレーション履歴がずれる恐れがある(前回のCodexレビューで指摘された懸念)。
// このテストは「re-exportであって再定義ではない」ことを参照の同一性で保証する。
describe("schema", () => {
  it("core.attemptsをそのままre-exportしている(再定義していない)", () => {
    expect(schema.attempts).toBe(coreAttempts);
  });

  it("auth側のテーブルをそのままre-exportしている(再定義していない)", () => {
    expect(schema.user).toBe(authUser);
    expect(schema.session).toBe(authSession);
    expect(schema.account).toBe(authAccount);
    expect(schema.verification).toBe(authVerification);
  });
});
