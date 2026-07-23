import { submitAnswer } from "@quiz/core/server";
import { cloudflareContext } from "~/context";
import { getQuizContext } from "~/quiz-context";
import type { Route } from "./+types/api.submit-answer";

export async function action({ request, context }: Route.ActionArgs) {
  const { store, auth } = getQuizContext(context.get(cloudflareContext).env);
  return submitAnswer(request, { store, auth });
}
