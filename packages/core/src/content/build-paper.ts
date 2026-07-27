import type { Paper } from "../domain/paper.ts";
import { parseFrontmatter } from "./parse-frontmatter.ts";

export type BuildPaperResult = { ok: true; data: Paper } | { ok: false; errors: string[] };

export function buildPaper(input: {
  paperId: string;
  markdown: string;
  format?: "markdown" | "mermaid";
}): BuildPaperResult {
  const { frontmatter, body } = parseFrontmatter(input.markdown);
  const errors: string[] = [];

  if (!frontmatter.title) {
    errors.push(`paper "${input.paperId}" is missing required frontmatter "title"`);
  }

  const order = frontmatter.order === undefined ? 0 : Number(frontmatter.order);
  if (!Number.isFinite(order)) {
    errors.push(`paper "${input.paperId}" has invalid "order": "${frontmatter.order}"`);
  }

  if (errors.length > 0) return { ok: false, errors };

  const markdown =
    input.format === "mermaid" ? `\`\`\`mermaid\n${body.trim()}\n\`\`\`` : body;

  return {
    ok: true,
    data: {
      id: input.paperId,
      title: frontmatter.title ?? input.paperId,
      description: frontmatter.description || null,
      order,
      markdown,
    },
  };
}
