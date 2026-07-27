import type { AuthLike } from "../actions/submit-answer.ts";
import type { Paper } from "../domain/paper.ts";

export type PaperListData = { loggedIn: false } | { loggedIn: true; papers: Paper[] };
export type PaperData =
  | { found: false }
  | { found: true; loggedIn: false }
  | { found: true; loggedIn: true; paper: Paper };

export async function loadPaperListData(input: {
  request: Request;
  auth: AuthLike;
  papers: Paper[];
}): Promise<PaperListData> {
  const session = await input.auth.api.getSession({ headers: input.request.headers });
  return session ? { loggedIn: true, papers: input.papers } : { loggedIn: false };
}

export async function loadPaperData(input: {
  request: Request;
  auth: AuthLike;
  papers: Paper[];
  paperId: string;
}): Promise<PaperData> {
  const paper = input.papers.find((candidate) => candidate.id === input.paperId);
  if (!paper) return { found: false };
  const session = await input.auth.api.getSession({ headers: input.request.headers });
  return session ? { found: true, loggedIn: true, paper } : { found: true, loggedIn: false };
}
