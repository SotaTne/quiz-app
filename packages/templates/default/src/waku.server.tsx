import { createAuth } from "@quiz/auth";
import { createStore, submitAnswer } from "@quiz/core";
import { createDb } from "@quiz/db";
import adapter from "waku/adapters/cloudflare";
import { createPages } from "waku/router/server";

type CloudflareEnv = {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
};

/**
 * `cloudflare:workers`はモジュールのトップレベルでstatic importしない。
 * @cloudflare/vite-pluginはdev/build中のリクエスト処理をworkerdで実行してくれるが、
 * ビルド後の静的生成(SSG)ステップはビルド成果物を素のNodeで読み込むため、
 * トップレベルimportだとその時点で`cloudflare:workers`が解決できずクラッシュする
 * (`ERR_UNSUPPORTED_ESM_URL_SCHEME`)。リクエストが来た時にだけ動的importで評価する。
 *
 * D1のようなバインディング(オブジェクト)はwaku標準の`getEnv()`では取得できない
 * (文字列のenv varsしか通さない実装のため)、`cloudflare:workers`の`env`を直接使う。
 */
async function getQuizContext() {
  const { env } = (await import("cloudflare:workers")) as unknown as { env: CloudflareEnv };

  const db = createDb(env.DB);
  const store = createStore(db);
  const auth = createAuth({
    db,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    allowedEmails: ["allow@example.com"],
    google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET },
  });

  return { store, auth };
}

const pages = createPages(async ({ createApi }) => {
  createApi({
    path: "/api/submit-answer",
    render: "dynamic",
    handlers: {
      POST: async (request) => {
        const { store, auth } = await getQuizContext();
        return submitAnswer(request, { store, auth });
      },
    },
  });

  return [];
});

// waku標準の`createPages`の戻り値をCloudflareアダプタでラップして初めて、
// ビルドパイプラインが期待する`.build`/`.fetch`を持つエントリになる
// (ラップし忘れると`INTERNAL_runBuild`で"build is not a function"になる)。
export default adapter(pages);
