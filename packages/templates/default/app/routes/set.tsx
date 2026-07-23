import { SetPage } from "@quiz/core";
import { loadSetData } from "@quiz/core/server";
import questionSets from "virtual:quiz-content";
import { cloudflareContext } from "~/context";
import { getQuizContext } from "~/quiz-context";
import type { Route } from "./+types/set";

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const { store, auth } = getQuizContext(context.get(cloudflareContext).env);
  return loadSetData({ request, store, auth, questionSets, setId: params["*"] });
}

export default function Set({ loaderData }: Route.ComponentProps) {
  return <SetPage data={loaderData} />;
}
