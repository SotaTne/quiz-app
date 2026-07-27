// @vitest-environment jsdom
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithMantine } from "../test-utils/render-with-mantine.tsx";
import { PaperContent } from "./paper-content.tsx";

vi.mock("./mermaid-diagram.tsx", () => ({
  MermaidDiagram: ({ source }: { source: string }) => <div data-testid="mermaid">{source}</div>,
}));

afterEach(cleanup);

describe("PaperContent", () => {
  it("GFM、インライン数式、ブロック数式を描画する", () => {
    const { container } = renderWithMantine(
      <PaperContent markdown={"~~削除~~ $E=mc^2$\n\n$$\n\\int_0^1 x dx\n$$"} />,
    );

    expect(screen.getByText("削除").tagName).toBe("DEL");
    expect(container.querySelector(".katex")).not.toBeNull();
    expect(container.querySelector(".katex-display")).not.toBeNull();
  });

  it("mermaidとmmdコードブロックをMermaidDiagramへ渡す", () => {
    renderWithMantine(
      <PaperContent markdown={"```mermaid\ngraph TD\nA-->B\n```\n\n```mmd\nflowchart LR\nC-->D\n```"} />,
    );

    expect(screen.getAllByTestId("mermaid").map((node) => node.textContent)).toEqual([
      "graph TD\nA-->B",
      "flowchart LR\nC-->D",
    ]);
  });

  it("Markdown中の生HTMLを実行可能なHTMLとして描画しない", () => {
    const { container } = renderWithMantine(<PaperContent markdown={'<img src="x" onerror="alert(1)">'} />);

    expect(container.querySelector("img")).toBeNull();
  });
});
