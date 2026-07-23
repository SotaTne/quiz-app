import { Button, Card, SimpleGrid, Text } from "@mantine/core";
import type { Question } from "../domain/question.ts";

export type FourChoiceViewProps = {
  question: Question;
  /** 呼び出し側が生成済みの4択(シャッフル済み)。判定はこのコンポーネントの責務外(SPEC.md 3.4)。 */
  choices: string[];
  onAnswer(selected: string): void;
};

/** 問題文と選択肢を表示するだけの4択画面。正誤判定は呼び出し側(checkAnswer)が行う。 */
export function FourChoiceView({ question, choices, onAnswer }: FourChoiceViewProps) {
  return (
    <Card withBorder radius="md" padding="xl">
      <Text ta="center" size="lg" fw={500} mb="lg">
        {question.question}
      </Text>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
        {choices.map((choice) => (
          <Button key={choice} variant="light" color="gray" onClick={() => onAnswer(choice)} h="auto" py="sm">
            {choice}
          </Button>
        ))}
      </SimpleGrid>
    </Card>
  );
}
