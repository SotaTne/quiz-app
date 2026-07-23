import { MantineProvider } from "@mantine/core";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { QuestionSet } from "../domain/question.ts";
import { SetListView } from "./set-list-view.tsx";

function makeSet(id: string, title: string, questionCount: number): QuestionSet {
  return {
    id,
    title,
    questions: Array.from({ length: questionCount }, (_, i) => ({
      id: `${id}-${i}`,
      question: "q",
      answer: "a",
      explanation: null,
    })),
  };
}

describe("SetListView", () => {
  it("セットが1つもない場合は案内メッセージを表示する", () => {
    const html = renderToStaticMarkup(
      <MantineProvider>
        <SetListView sets={[]} />
      </MantineProvider>,
    );

    expect(html).toContain("まだセットがありません");
  });

  it("各セットのタイトル・問題数・習熟度を表示する", () => {
    const html = renderToStaticMarkup(
      <MantineProvider>
        <SetListView
          sets={[
            { set: makeSet("english/part1", "英語 Part1", 10), masteryPercent: 40 },
            { set: makeSet("javascript", "JavaScript", 5), masteryPercent: null },
          ]}
        />
      </MantineProvider>,
    );

    expect(html).toContain("英語 Part1");
    expect(html).toContain("10問");
    expect(html).toContain("40%");
    expect(html).toContain("JavaScript");
    expect(html).toContain("未着手");
  });

  it("階層を持つsetIdでも、そのままリンク先パスに使う", () => {
    const html = renderToStaticMarkup(
      <MantineProvider>
        <SetListView sets={[{ set: makeSet("english/part1", "英語 Part1", 1), masteryPercent: null }]} />
      </MantineProvider>,
    );

    expect(html).toContain('href="/sets/english/part1"');
  });
});
