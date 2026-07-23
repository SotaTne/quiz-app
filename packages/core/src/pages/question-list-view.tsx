import { Badge, Button, Group, SegmentedControl, Stack, Text, UnstyledButton } from "@mantine/core";
import type { Mode } from "../domain/attempt.ts";
import type { Question } from "../domain/question.ts";
import type { FilterType } from "../filters/apply-filter.ts";
import { accuracyColor } from "./accuracy-color.ts";

export type QuestionAccuracyStat = { total: number; correct: number } | null;

export type QuestionListViewProps = {
  mode: Mode;
  onModeChange(mode: Mode): void;
  filterType: FilterType;
  onFilterChange(filterType: FilterType): void;
  questions: Question[];
  accuracyOf(questionId: string): QuestionAccuracyStat;
  onStartAll(): void;
  onStartQuestion(questionId: string): void;
};

function StatusBadge({ stat }: { stat: QuestionAccuracyStat }) {
  if (!stat || stat.total === 0) {
    return (
      <Badge color="gray" variant="light">
        未回答
      </Badge>
    );
  }
  const percent = Math.round((stat.correct / stat.total) * 100);
  return (
    <Badge color={accuracyColor(percent)} variant="light">
      {percent}%({stat.correct}/{stat.total})
    </Badge>
  );
}

/** セット詳細のトップ画面。モード/絞り込みを切り替えながら問題一覧を眺め、好きな問題から練習を始められる。 */
export function QuestionListView({
  mode,
  onModeChange,
  filterType,
  onFilterChange,
  questions,
  accuracyOf,
  onStartAll,
  onStartQuestion,
}: QuestionListViewProps) {
  return (
    <Stack gap="lg">
      <Group gap="xs" wrap="wrap">
        <SegmentedControl
          value={mode}
          onChange={(value) => onModeChange(value as Mode)}
          data={[
            { label: "フラッシュカード", value: "flashcard" },
            { label: "4択", value: "quiz" },
          ]}
        />
        <SegmentedControl
          value={filterType}
          onChange={(value) => onFilterChange(value as FilterType)}
          data={[
            { label: "全問", value: "all" },
            { label: "間違えた問題のみ", value: "wrong" },
            { label: "苦手問題", value: "weak" },
          ]}
        />
      </Group>

      {questions.length === 0 ? (
        <Text c="dimmed">この条件に一致する問題はありません。</Text>
      ) : (
        <>
          <Button onClick={onStartAll} w="100%">
            始める({questions.length}問)
          </Button>

          <Stack gap={4}>
            {questions.map((question) => (
              <UnstyledButton
                key={question.id}
                onClick={() => onStartQuestion(question.id)}
                p="sm"
                style={{ borderRadius: 8, border: "1px solid var(--mantine-color-gray-3)" }}
              >
                <Group justify="space-between" wrap="nowrap">
                  <Text size="sm" style={{ flex: 1 }} lineClamp={1}>
                    {question.question}
                  </Text>
                  <StatusBadge stat={accuracyOf(question.id)} />
                </Group>
              </UnstyledButton>
            ))}
          </Stack>
        </>
      )}
    </Stack>
  );
}
