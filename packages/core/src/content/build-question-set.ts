import type { Question, QuestionSet } from "../domain/question";
import { parseFrontmatter } from "./parse-frontmatter";
import { parseTable } from "./parse-table";

export type BuildQuestionSetResult =
  | { ok: true; data: QuestionSet }
  | { ok: false; errors: string[] };

const REQUIRED_COLUMNS = ["id", "question", "answer"] as const;

/** Parses a single content markdown file (one set) into a validated `QuestionSet`. */
export function buildQuestionSet(input: { setId: string; markdown: string }): BuildQuestionSetResult {
  const { frontmatter, body } = parseFrontmatter(input.markdown);
  const rows = parseTable(body);

  const errors: string[] = [];
  if (rows.length === 0) {
    errors.push(`set "${input.setId}" has no question rows`);
    return { ok: false, errors };
  }

  const seenIds = new Set<string>();
  const questions: Question[] = [];

  rows.forEach((row, index) => {
    for (const column of REQUIRED_COLUMNS) {
      if (!row[column]) {
        errors.push(`set "${input.setId}" row ${index + 1} is missing required column "${column}"`);
      }
    }
    if (row.id && seenIds.has(row.id)) {
      errors.push(`set "${input.setId}" has a duplicate id "${row.id}"`);
    }
    if (row.id) seenIds.add(row.id);

    questions.push({
      id: row.id ?? "",
      question: row.question ?? "",
      answer: row.answer ?? "",
      explanation: row.explanation ? row.explanation : null,
    });
  });

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      id: input.setId,
      title: frontmatter.title ?? input.setId,
      questions,
    },
  };
}
