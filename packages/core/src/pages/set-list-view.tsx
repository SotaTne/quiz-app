import { Badge, Card, Group, Stack, Text } from "@mantine/core";
import type { QuestionSet } from "../domain/question.ts";
import { accuracyColor } from "./accuracy-color.ts";

export type SetSummary = {
  set: QuestionSet;
  /** 0〜100。4択で1度も回答していなければnull。 */
  quizMasteryPercent: number | null;
  /** 0〜100。フラッシュカードで1度も回答していなければnull。 */
  flashcardMasteryPercent: number | null;
};

export type SetListViewProps = {
  sets: SetSummary[];
};

function MasteryBadge({ label, percent }: { label: string; percent: number | null }) {
  if (percent === null) {
    return (
      <Badge color="gray" variant="light">
        {label}: 未着手
      </Badge>
    );
  }
  return (
    <Badge color={accuracyColor(percent)} variant="light">
      {label}: {percent}%
    </Badge>
  );
}

/**
 * セット一覧画面。Notion風に装飾を絞り、各行は「タイトル・問題数・4択/フラッシュカード別の習熟度」を表示する
 * (行あたりの操作はセットを開くリンク1つのみ)。
 * 問題数と習熟度バッジは同じ行に並べ、狭い画面でも折り返して両方見えるようにする。
 * データ取得(virtual:quiz-contentの読み込み・習熟度の集計)はこのコンポーネントの外側が担う。
 */
export function SetListView({ sets }: SetListViewProps) {
  if (sets.length === 0) {
    return <Text c="dimmed">まだセットがありません。content/questions/にMarkdownファイルを追加してください。</Text>;
  }

  return (
    <Stack gap="sm">
      {sets.map(({ set, quizMasteryPercent, flashcardMasteryPercent }) => (
        <Card key={set.id} component="a" href={`/sets/${set.id}`} withBorder radius="md" padding="md">
          <Text fw={600} mb={4}>
            {set.title}
          </Text>
          <Group justify="space-between" wrap="wrap" gap="xs">
            <Text size="sm" c="dimmed">
              {set.questions.length}問
            </Text>
            <Group gap="xs" wrap="wrap">
              <MasteryBadge label="4択" percent={quizMasteryPercent} />
              <MasteryBadge label="カード" percent={flashcardMasteryPercent} />
            </Group>
          </Group>
        </Card>
      ))}
    </Stack>
  );
}
