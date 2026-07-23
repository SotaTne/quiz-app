import { defineQuizConfig } from "@quiz/core";
import { createAuth } from "@quiz/auth";
import { createDb } from "@quiz/db";

// wrangler.tomlのD1バインディング名と合わせること
declare const env: { DB: D1Database; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string; GOOGLE_CLIENT_ID: string; GOOGLE_CLIENT_SECRET: string };

const db = createDb(env.DB);
const auth = createAuth({
  db,
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  allowedEmails: ["allow@example.com"],
  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  },
});

export default defineQuizConfig({
  contentDir: "./content/questions",
  db,
  auth,
});
