"use client";

import { useState } from "react";
import type { Question } from "../domain/question";

export type FlashcardViewProps = {
  question: Question;
  /** 「知ってる」を押せばtrue、「知らない」を押せばfalseで呼ばれる。判定は自己申告そのまま(SPEC.md 3.4)。 */
  onAnswer(isCorrect: boolean): void;
};

/** カード表面(問題文)をタップすると裏面(答え)を表示し、その後「知ってる/知らない」を選ぶ。 */
export function FlashcardView({ question, onAnswer }: FlashcardViewProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div>
      <button type="button" onClick={() => setFlipped((current) => !current)}>
        {flipped ? question.answer : question.question}
      </button>
      {flipped && (
        <div>
          <button type="button" onClick={() => onAnswer(false)}>
            知らない
          </button>
          <button type="button" onClick={() => onAnswer(true)}>
            知ってる
          </button>
        </div>
      )}
    </div>
  );
}
