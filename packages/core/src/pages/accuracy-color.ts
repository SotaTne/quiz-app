/** 正答率(0〜100)に応じたMantineのcolor名を返す。セッションのバッジ・問題一覧の両方で使う。 */
export function accuracyColor(percent: number): string {
  if (percent >= 70) return "green";
  if (percent >= 40) return "yellow";
  return "red";
}
