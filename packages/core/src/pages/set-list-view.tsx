import { Badge, Card, Group, Progress, Stack, Text } from "@mantine/core";
import type { QuestionSet } from "../domain/question.ts";

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
    return <Text c="dimmed">まだセットがありません。content/questions/にMarkdownファイルを追加してください。</Text>;
  }

  return (
    <Stack gap="sm">
      {sets.map(({ set, masteryPercent }) => (
        <Card key={set.id} component="a" href={`/sets/${set.id}`} withBorder radius="md" padding="md">
          <Group justify="space-between" wrap="nowrap">
            <div>
              <Text fw={600}>{set.title}</Text>
              <Text size="sm" c="dimmed">
                {set.questions.length}問
              </Text>
            </div>
            {masteryPercent === null ? (
              <Badge color="gray" variant="light">
                未着手
              </Badge>
            ) : (
              <Group gap={8} wrap="nowrap">
                <Progress value={masteryPercent} w={60} size="sm" radius="xl" />
                <Text size="sm" c="dimmed">
                  {masteryPercent}%
                </Text>
              </Group>
            )}
          </Group>
        </Card>
      ))}
    </Stack>
  );
}
