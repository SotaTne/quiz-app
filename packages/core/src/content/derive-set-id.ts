import { relative, sep } from "node:path";

/**
 * `contentDir`配下のファイルパスから、階層を保ったsetIdを導出する。
 * 例: content/questions/english/part1.md → "english/part1"(サブディレクトリはカテゴリ分けとして残す)。
 */
export function deriveSetId(contentDir: string, filePath: string): string {
  const relativePath = relative(contentDir, filePath).split(sep).join("/");
  return relativePath.replace(/\.md$/, "");
}
