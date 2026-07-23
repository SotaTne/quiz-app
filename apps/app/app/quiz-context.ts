import { createAuth } from "@quiz/auth";
import { createStore } from "@quiz/core/server";
import { createDb } from "@quiz/db";

/**
 * Cloudflareのbindings(`context.get(cloudflareContext).env`)からstore/authを組み立てる。
 * baseURLは環境変数に固定値を持たず、リクエストのオリジンから毎回算出する
 * (ローカル/本番/カスタムドメインを環境変数で管理しなくても自動的に正しいURLになる)。
 */
export function getQuizContext(env: Env, request: Request) {
  const db = createDb(env.DB);
  const store = createStore(db);
  const auth = createAuth({
    db,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: new URL(request.url).origin,
    allowedEmails: env.ALLOWED_EMAILS.split(",").map((email) => email.trim()),
    google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET },
  });

  return { store, auth };
}
