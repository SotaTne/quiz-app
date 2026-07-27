import { PaperListPage } from "@quiz/core";
import { loadPaperListData } from "@quiz/core/server";
import papers from "virtual:paper-content";
import { cloudflareContext } from "~/context";
import { getQuizContext } from "~/quiz-context";
import type { Route } from "./+types/paper-index";

export async function loader({ request, context }: Route.LoaderArgs) {
  const { auth } = getQuizContext(context.get(cloudflareContext).env, request);
  return loadPaperListData({ request, auth, papers });
}

export default function PaperIndex({ loaderData }: Route.ComponentProps) {
  return <PaperListPage data={loaderData} />;
}
