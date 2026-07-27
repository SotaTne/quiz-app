import { PaperPage } from "@quiz/core";
import { loadPaperData } from "@quiz/core/server";
import papers from "virtual:paper-content";
import { cloudflareContext } from "~/context";
import { getQuizContext } from "~/quiz-context";
import type { Route } from "./+types/paper";

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const { auth } = getQuizContext(context.get(cloudflareContext).env, request);
  return loadPaperData({ request, auth, papers, paperId: params["*"] });
}

export default function Paper({ loaderData }: Route.ComponentProps) {
  return <PaperPage data={loaderData} />;
}
