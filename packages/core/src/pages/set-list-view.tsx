import type { QuestionSet } from "../domain/question";

export type SetSummary = {
  set: QuestionSet;
  /** 0〜100。そのセットでまだ一度も回答していなければnull。 */
  masteryPercent: number | null;
};

export type SetListViewProps = {
  sets: SetSummary[];
};

/**
 * セット一覧画面。Notion風に装飾を絞り、各行は「タイトル・問題数・習熟度」だけを表示する
 * (行あたりの操作はセットを開くリンク1つのみ)。
 * データ取得(virtual:quiz-contentの読み込み・習熟度の集計)はこのコンポーネントの外側が担う。
 */
export function SetListView({ sets }: SetListViewProps) {
  if (sets.length === 0) {
    return <p>まだセットがありません。content/questions/にMarkdownファイルを追加してください。</p>;
  }

  return (
    <ul>
      {sets.map(({ set, masteryPercent }) => (
        <li key={set.id}>
          <a href={`/sets/${set.id}`}>{set.title}</a>
          <span>{set.questions.length}問</span>
          <span>{masteryPercent === null ? "未着手" : `${masteryPercent}%`}</span>
        </li>
      ))}
    </ul>
  );
}
