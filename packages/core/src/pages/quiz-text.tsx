import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

/** 問題テーブルのセル文字列を、レイアウトを増やさずMarkdown・数式として表示する。 */
export function QuizText({ text }: { text: string }) {
  return (
    <span>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <>{children}</>,
          code: ({ children }) => (
            <code
              style={{
                background: "var(--mantine-color-gray-1)",
                borderRadius: 4,
                padding: "0.1em 0.35em",
                fontSize: "0.9em",
              }}
            >
              {children}
            </code>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </span>
  );
}
