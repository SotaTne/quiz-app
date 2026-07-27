// @vitest-environment jsdom
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { renderWithMantine } from "../test-utils/render-with-mantine.tsx";
import { QuizText } from "./quiz-text.tsx";

afterEach(cleanup);

describe("QuizText", () => {
  it("インライン数式をKaTeXで描画する", () => {
    const { container } = renderWithMantine(
      <QuizText text={"選択は $\\sigma_{\\text{学年}=3}(\\text{学生})$ と書く"} />,
    );

    expect(container.querySelector(".katex")).not.toBeNull();
    expect(container.textContent).not.toContain("$");
  });

  it("バッククォート記法をcode要素として描画する", () => {
    renderWithMantine(<QuizText text={"SQLでは `SELECT *` を使う"} />);

    expect(screen.getByText("SELECT *").tagName).toBe("CODE");
  });

  it("生HTMLをHTML要素として描画しない", () => {
    const { container } = renderWithMantine(<QuizText text={'<img src="x">'} />);

    expect(container.querySelector("img")).toBeNull();
  });
});
