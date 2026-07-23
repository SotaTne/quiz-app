import { APIError } from "better-auth/api";
import { betterAuth } from "better-auth";
import { drizzleAdapter, type DB } from "better-auth/adapters/drizzle";
import { isEmailAllowed } from "./is-email-allowed";
import * as schema from "./schema";

export type CreateAuthOptions = {
  db: DB;
  secret: string;
  baseURL: string;
  allowedEmails: string[];
  google: { clientId: string; clientSecret: string };
};

/**
 * Google OAuthのみ + allowlistを組み込んだbetter-authインスタンスを作る。
 * secret/baseURL/allowedEmails/Google認証情報の実際の値は`app`から渡してもらう(このパッケージは持たない)。
 *
 * allowlistは`user.create.before`フックで弾く(アカウント作成自体を阻止する)。
 * 既存ユーザーを後からallowedEmailsで締め出すケースは想定していない
 * (個人用アプリのため、締め出したい場合はユーザー行を手動で削除すればよい)。
 */
export function createAuth(options: CreateAuthOptions) {
  return betterAuth({
    database: drizzleAdapter(options.db, { provider: "sqlite", schema }),
    secret: options.secret,
    baseURL: options.baseURL,
    socialProviders: {
      google: options.google,
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (!isEmailAllowed(user.email, options.allowedEmails)) {
              throw new APIError("FORBIDDEN", {
                message: "このメールアドレスはこのアプリの利用を許可されていません。",
              });
            }
            return { data: user };
          },
        },
      },
    },
  });
}
