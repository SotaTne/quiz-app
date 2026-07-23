import { Anchor, Badge, Button, Card, Group, Progress, Stack, Text } from "@mantine/core";
import type { Mode } from "../domain/attempt.ts";
import type { Question } from "../domain/question.ts";
import { accuracyColor } from "./accuracy-color.ts";
import { FlashcardView } from "./flashcard-view.tsx";
import { FourChoiceView } from "./four-choice-view.tsx";

export type PracticeViewProps = {
  mode: Mode;
  question: Question | undefined;
  position: number;
  total: number;
  choices: string[] | null;
  result: { isCorrect: boolean } | null;
  sessionAnswered: number;
  sessionCorrect: number;
  wrongCount: number;
  onBackToList(): void;
  onPrev(): void;
  onSkip(): void;
  onNext(): void;
  onAnswerQuiz(selected: string): void;
  onAnswerFlashcard(isCorrect: boolean): void;
  onRetryWrong(): void;
};

/** セット単位の演習(1問ずつ進める)画面。4択/フラッシュカード共通で戻る・スキップができる。 */
export function PracticeView({
  mode,
  question,
  position,
  total,
  choices,
  result,
  sessionAnswered,
  sessionCorrect,
  wrongCount,
  onBackToList,
  onPrev,
  onSkip,
  onNext,
  onAnswerQuiz,
  onAnswerFlashcard,
  onRetryWrong,
}: PracticeViewProps) {
  const accuracyPercent = sessionAnswered === 0 ? null : Math.round((sessionCorrect / sessionAnswered) * 100);

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Anchor component="button" type="button" onClick={onBackToList} size="sm">
          問題一覧に戻る
        </Anchor>
        {accuracyPercent !== null && (
          <Badge variant="light" color={accuracyColor(accuracyPercent)}>
            正答率 {accuracyPercent}%({sessionCorrect}/{sessionAnswered})
          </Badge>
        )}
      </Group>

      <Group gap="sm">
        <Button variant="subtle" size="compact-sm" onClick={onPrev} disabled={position === 0}>
          ← 前へ
        </Button>
        <Progress value={total === 0 ? 0 : (position / total) * 100} size="sm" radius="xl" style={{ flex: 1 }} />
        <Button variant="subtle" size="compact-sm" onClick={onSkip} disabled={!question}>
          スキップ →
        </Button>
      </Group>

      {!question && (
        <Card withBorder radius="md" padding="xl">
          <Stack align="center" gap="md">
            <Text ta="center">これ以上の問題はありません。おつかれさまでした。</Text>
            {accuracyPercent !== null && (
              <Text ta="center" c="dimmed">
                正答率 {accuracyPercent}%({sessionCorrect}/{sessionAnswered})
              </Text>
            )}
            <Group>
              {wrongCount > 0 && <Button onClick={onRetryWrong}>間違えた問題だけもう一度({wrongCount}問)</Button>}
              <Button variant="light" onClick={onBackToList}>
                問題一覧に戻る
              </Button>
            </Group>
          </Stack>
        </Card>
      )}

      {question && result && (
        <Card withBorder radius="md" padding="xl">
          <Stack gap="sm" align="center">
            <Text size="lg" fw={600} c={result.isCorrect ? "green" : "red"}>
              {result.isCorrect ? "正解!" : `不正解。正しい答え: ${question.answer}`}
            </Text>
            {question.explanation && (
              <Text size="sm" c="dimmed" ta="center">
                {question.explanation}
              </Text>
            )}
            <Button onClick={onNext}>次の問題へ</Button>
          </Stack>
        </Card>
      )}

      {question && !result && mode === "quiz" && choices && (
        <FourChoiceView key={question.id} question={question} choices={choices} onAnswer={onAnswerQuiz} />
      )}

      {question && !result && mode === "quiz" && !choices && (
        <Card withBorder radius="md" padding="xl">
          <Stack align="center" gap="sm">
            <Text ta="center">この問題は選択肢が不足しているため4択にできません。</Text>
            <Button onClick={onSkip}>次の問題へ</Button>
          </Stack>
        </Card>
      )}

      {question && mode === "flashcard" && (
        <FlashcardView key={question.id} question={question} onAnswer={onAnswerFlashcard} />
      )}
    </Stack>
  );
}
