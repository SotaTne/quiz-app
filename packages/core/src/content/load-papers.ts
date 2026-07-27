import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, relative, sep } from "node:path";
import type { Paper } from "../domain/paper.ts";
import { buildPaper } from "./build-paper.ts";

export type LoadPapersResult = { ok: true; data: Paper[] } | { ok: false; errors: string[] };

function findPaperFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) return findPaperFiles(fullPath);
    return [".md", ".mmd"].includes(extname(entry.name).toLowerCase()) ? [fullPath] : [];
  });
}

function derivePaperId(contentDir: string, filePath: string): string {
  const extension = extname(filePath);
  return relative(contentDir, filePath).slice(0, -extension.length).split(sep).join("/");
}

export function loadPapers(contentDir: string): LoadPapersResult {
  if (!existsSync(contentDir)) return { ok: true, data: [] };

  const errors: string[] = [];
  const papers: Paper[] = [];

  for (const filePath of findPaperFiles(contentDir)) {
    const paperId = derivePaperId(contentDir, filePath);
    const result = buildPaper({
      paperId,
      markdown: readFileSync(filePath, "utf-8"),
      format: extname(filePath).toLowerCase() === ".mmd" ? "mermaid" : "markdown",
    });
    if (!result.ok) {
      errors.push(...result.errors);
    } else {
      papers.push(result.data);
    }
  }

  papers.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, "ja"));
  return errors.length > 0 ? { ok: false, errors } : { ok: true, data: papers };
}
