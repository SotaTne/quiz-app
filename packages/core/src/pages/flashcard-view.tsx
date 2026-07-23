import { Button, Card, Group, Text } from "@mantine/core";
import { useRef, useState } from "react";
import type { Question } from "../domain/question.ts";

export type FlashcardViewProps = {
  question: Question;
  /** 「知ってる」を押せばtrue、「知らない」を押せばfalseで呼ばれる。判定は自己申告そのまま(SPEC.md 3.4)。 */
  onAnswer(isCorrect: boolean): void;
};

const SWIPE_THRESHOLD = 80;

/**
 * カード表面(問題文)をタップすると裏面(答え+解説)を表示し、その後「知ってる/知らない」を選ぶ。
 * Quizletと同様、カードを左右にドラッグして直接回答することもできる(右=知ってる、左=知らない)。
 */
export function FlashcardView({ question, onAnswer }: FlashcardViewProps) {
  const [flipped, setFlipped] = useState(false);
  const [dragX, setDragX] = useState(0);
  const dragStartRef = useRef<number | null>(null);
  const didDragRef = useRef(false);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    // ボタン上から始まったポインタはドラッグ扱いにしない。setPointerCaptureをカード全体に
    // かけると、ボタンへのclickがカード自身にリターゲットされ「知ってる/知らない」が
    // 効かずカードが裏返るだけになる不具合があったため。
    if ((event.target as HTMLElement).closest("button")) return;
    dragStartRef.current = event.clientX;
    didDragRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (dragStartRef.current === null) return;
    const delta = event.clientX - dragStartRef.current;
    if (Math.abs(delta) > 5) didDragRef.current = true;
    setDragX(delta);
  }

  function handlePointerUp() {
    if (dragStartRef.current === null) return;
    dragStartRef.current = null;
    if (dragX > SWIPE_THRESHOLD) {
      onAnswer(true);
    } else if (dragX < -SWIPE_THRESHOLD) {
      onAnswer(false);
    }
    setDragX(0);
  }

  function handleCardClick() {
    if (didDragRef.current) return;
    setFlipped((current) => !current);
  }

  return (
    <Card
      withBorder
      radius="md"
      padding="xl"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleCardClick}
      style={{
        transform: `translateX(${dragX}px) rotate(${dragX / 20}deg)`,
        transition: dragStartRef.current === null ? "transform 0.2s ease" : "none",
        cursor: "grab",
        touchAction: "pan-y",
        userSelect: "none",
      }}
    >
      <Text ta="center" size="lg" fw={500} style={{ userSelect: "text" }}>
        {flipped ? question.answer : question.question}
      </Text>
      {flipped && question.explanation && (
        <Text ta="center" size="sm" c="dimmed" mt="sm" style={{ userSelect: "text" }}>
          {question.explanation}
        </Text>
      )}
      <Group justify="center" gap="xl" mt="lg">
        <Button
          variant="light"
          color="red"
          onClick={(event) => {
            event.stopPropagation();
            onAnswer(false);
          }}
        >
          知らない
        </Button>
        <Button
          variant="light"
          color="green"
          onClick={(event) => {
            event.stopPropagation();
            onAnswer(true);
          }}
        >
          知ってる
        </Button>
      </Group>
    </Card>
  );
}
