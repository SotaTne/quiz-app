import { HomePage } from "@quiz/core";
import { loadHomeData } from "@quiz/core/server";
import questionSets from "virtual:quiz-content";
import { cloudflareContext } from "~/context";
import { getQuizContext } from "~/quiz-context";
import type { Route } from "./+types/home";

export async function loader({ request, context }: Route.LoaderArgs) {
  const { store, auth } = getQuizContext(context.get(cloudflareContext).env);
  return loadHomeData({ request, store, auth, questionSets });
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <HomePage data={loaderData} />;
}
