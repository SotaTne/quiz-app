// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Question } from "../domain/question";
import { FourChoiceView } from "./four-choice-view";

const question: Question = { id: "q1", question: "1+1は?", answer: "2", explanation: null };

afterEach(() => {
  cleanup();
});

describe("FourChoiceView", () => {
  it("問題文と4つの選択肢を表示する", () => {
    render(<FourChoiceView question={question} choices={["1", "2", "3", "4"]} onAnswer={() => {}} />);

    expect(screen.getByText("1+1は?")).toBeTruthy();
    for (const choice of ["1", "2", "3", "4"]) {
      expect(screen.getByText(choice)).toBeTruthy();
    }
  });

  it("選択肢をクリックするとonAnswerにその文字列を渡す", () => {
    const onAnswer = vi.fn();
    render(<FourChoiceView question={question} choices={["1", "2", "3", "4"]} onAnswer={onAnswer} />);

    fireEvent.click(screen.getByText("3"));

    expect(onAnswer).toHaveBeenCalledWith("3");
  });
});
