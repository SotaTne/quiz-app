import { createAuth } from "@quiz/auth";
import { createStore } from "@quiz/core/server";
import { createDb } from "@quiz/db";

/** Cloudflareのbindings(`context.get(cloudflareContext).env`)からstore/authを組み立てる。 */
export function getQuizContext(env: Env) {
  const db = createDb(env.DB);
  const store = createStore(db);
  const auth = createAuth({
    db,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    allowedEmails: env.ALLOWED_EMAILS.split(",").map((email) => email.trim()),
    google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET },
  });

  return { store, auth };
}
