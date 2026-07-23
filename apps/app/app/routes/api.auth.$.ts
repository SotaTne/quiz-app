import { cloudflareContext } from "~/context";
import { getQuizContext } from "~/quiz-context";
import type { Route } from "./+types/api.auth.$";

// better-auth自身のHTTPルート(/sign-in/social, /sign-out, /callback/google等)を丸ごとマウントする。
// GET(コールバック等)・POST(サインイン等)の両方があるため、loader/actionの両方から同じ処理に委譲する。
async function handle({ request, context }: Route.LoaderArgs | Route.ActionArgs) {
  const { auth } = getQuizContext(context.get(cloudflareContext).env, request);
  return auth.handler(request);
}

export const loader = handle;
export const action = handle;
