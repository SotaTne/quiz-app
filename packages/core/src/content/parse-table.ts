const SEPARATOR_ROW = /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?$/;

function splitRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

/**
 * `markdown`内で最初に見つかったテーブルを、ヘッダー名をキーにした行オブジェクトの配列に変換する。
 * `| a | b |` 形式・先頭/末尾の `|` を省略した `a | b` 形式のどちらも受け付ける。
 */
export function parseTable(markdown: string): Record<string, string>[] {
  const lines = markdown.split("\n").map((line) => line.trim());

  const separatorIndex = lines.findIndex(
    (line, index) => index > 0 && line.includes("|") && SEPARATOR_ROW.test(line) && Boolean(lines[index - 1]),
  );
  if (separatorIndex <= 0) return [];

  const headerLine = lines[separatorIndex - 1];
  if (!headerLine) return [];
  const headers = splitRow(headerLine);

  const dataLines: string[] = [];
  for (let i = separatorIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || !line.includes("|")) break;
    dataLines.push(line);
  }

  return dataLines.map((line) => {
    const cells = splitRow(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  });
}
