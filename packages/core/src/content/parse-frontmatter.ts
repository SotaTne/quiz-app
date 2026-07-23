export type ParsedFrontmatter = {
  frontmatter: Record<string, string>;
  body: string;
};

/** Splits a leading `---`-delimited YAML-ish block (flat `key: value` pairs only) from the rest of the document. */
export function parseFrontmatter(source: string): ParsedFrontmatter {
  const lines = source.split("\n");

  if (lines[0]?.trim() !== "---") {
    return { frontmatter: {}, body: source };
  }

  const closingIndex = lines.slice(1).findIndex((line) => line.trim() === "---");
  if (closingIndex === -1) {
    return { frontmatter: {}, body: source };
  }

  const frontmatterLines = lines.slice(1, closingIndex + 1);
  const frontmatter: Record<string, string> = {};
  for (const line of frontmatterLines) {
    if (!line.trim()) continue;
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) continue;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    frontmatter[key] = value;
  }

  const body = lines.slice(closingIndex + 2).join("\n");
  return { frontmatter, body };
}
