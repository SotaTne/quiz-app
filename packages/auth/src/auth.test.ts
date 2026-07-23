import BetterSqlite3 from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { createAuth } from "./auth";

// better-authの標準テーブル(schema.ts参照)を模したもの。実際のGoogle OAuthフローは
// 外部リダイレクトを伴うためモックせず、createAuth()が正しく組み立てられているか
// (Googleプロバイダの設定、user.create.beforeフックの動作)だけを検証する。
const CREATE_TABLES = `
  create table user (
    id text primary key,
    name text not null,
    email text not null unique,
    email_verified integer not null,
    image text,
    created_at integer not null,
    updated_at integer not null
  );
  create table session (
    id text primary key,
    user_id text not null,
    token text not null unique,
    expires_at integer not null,
    ip_address text,
    user_agent text,
    created_at integer not null,
    updated_at integer not null
  );
  create table account (
    id text primary key,
    user_id text not null,
    account_id text not null,
    provider_id text not null,
    access_token text,
    refresh_token text,
    access_token_expires_at integer,
    refresh_token_expires_at integer,
    scope text,
    id_token text,
    password text,
    created_at integer not null,
    updated_at integer not null
  );
  create table verification (
    id text primary key,
    identifier text not null,
    value text not null,
    expires_at integer not null,
    created_at integer not null,
    updated_at integer not null
  );
`;

function setupAuth(allowedEmails: string[]) {
  const sqlite = new BetterSqlite3(":memory:");
  sqlite.exec(CREATE_TABLES);
  return createAuth({
    db: sqlite,
    secret: "test-secret",
    baseURL: "http://localhost:3000",
    allowedEmails,
    google: { clientId: "test-client-id", clientSecret: "test-client-secret" },
  });
}

function fakeUser(email: string) {
  return {
    id: "u1",
    name: "test",
    email,
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("createAuth", () => {
  it("渡したGoogleの認証情報がそのままsocialProvidersに反映される", () => {
    const auth = setupAuth(["allow@example.com"]);

    expect(auth.options.socialProviders?.google).toMatchObject({
      clientId: "test-client-id",
      clientSecret: "test-client-secret",
    });
  });

  it("allowedEmailsに含まれるメールアドレスはユーザー作成フックを通過する", async () => {
    const auth = setupAuth(["allow@example.com"]);
    const before = auth.options.databaseHooks?.user?.create?.before;

    await expect(before?.(fakeUser("allow@example.com"))).resolves.not.toThrow();
  });

  it("allowedEmailsにないメールアドレスはユーザー作成フックで拒否される", async () => {
    const auth = setupAuth(["allow@example.com"]);
    const before = auth.options.databaseHooks?.user?.create?.before;

    await expect(before?.(fakeUser("deny@example.com"))).rejects.toThrow();
  });
});
