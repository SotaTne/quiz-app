// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Question } from "../domain/question";
import { FlashcardView } from "./flashcard-view";

const question: Question = { id: "q1", question: "1+1は?", answer: "2", explanation: null };

afterEach(() => {
  cleanup();
});

describe("FlashcardView", () => {
  it("最初は表(問題文)だけを表示し、裏(答え)はまだ見せない", () => {
    render(<FlashcardView question={question} onAnswer={() => {}} />);

    expect(screen.getByText("1+1は?")).toBeTruthy();
    expect(screen.queryByText("2")).toBeNull();
  });

  it("カードをタップすると裏(答え)を表示する", () => {
    render(<FlashcardView question={question} onAnswer={() => {}} />);

    fireEvent.click(screen.getByText("1+1は?"));

    expect(screen.getByText("2")).toBeTruthy();
  });

  it("裏返した後に「知ってる」を押すとonAnswer(true)を呼ぶ", () => {
    const onAnswer = vi.fn();
    render(<FlashcardView question={question} onAnswer={onAnswer} />);

    fireEvent.click(screen.getByText("1+1は?"));
    fireEvent.click(screen.getByText("知ってる"));

    expect(onAnswer).toHaveBeenCalledWith(true);
  });

  it("裏返した後に「知らない」を押すとonAnswer(false)を呼ぶ", () => {
    const onAnswer = vi.fn();
    render(<FlashcardView question={question} onAnswer={onAnswer} />);

    fireEvent.click(screen.getByText("1+1は?"));
    fireEvent.click(screen.getByText("知らない"));

    expect(onAnswer).toHaveBeenCalledWith(false);
  });
});
