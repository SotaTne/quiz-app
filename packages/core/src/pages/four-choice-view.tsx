"use client";

import type { Question } from "../domain/question";

export type FourChoiceViewProps = {
  question: Question;
  /** 呼び出し側が生成済みの4択(シャッフル済み)。判定はこのコンポーネントの責務外(SPEC.md 3.4)。 */
  choices: string[];
  onAnswer(selected: string): void;
};

/** 問題文と選択肢を表示するだけの4択画面。正誤判定は呼び出し側(checkAnswer)が行う。 */
export function FourChoiceView({ question, choices, onAnswer }: FourChoiceViewProps) {
  return (
    <div>
      <p>{question.question}</p>
      <ul>
        {choices.map((choice) => (
          <li key={choice}>
            <button type="button" onClick={() => onAnswer(choice)}>
              {choice}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
