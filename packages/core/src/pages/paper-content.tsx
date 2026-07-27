import { Box, Code } from "@mantine/core";
import "katex/dist/katex.min.css";
import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { MermaidDiagram } from "./mermaid-diagram.tsx";

function CodeBlock({ className, children, ...props }: ComponentPropsWithoutRef<"code">) {
  const language = /language-([^\s]+)/.exec(className ?? "")?.[1]?.toLowerCase();
  const source = String(children).replace(/\n$/, "");

  if (language === "mermaid" || language === "mmd") {
    return <MermaidDiagram source={source} />;
  }

  if (className) {
    return (
      <Box component="pre" p="md" bg="gray.0" style={{ overflowX: "auto", borderRadius: 8 }}>
        <code className={className} {...props}>
          {children}
        </code>
      </Box>
    );
  }

  return <Code {...props}>{children}</Code>;
}

export function PaperContent({ markdown }: { markdown: string }) {
  return (
    <Box className="paper-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code: CodeBlock,
          table: ({ children }) => (
            <Box style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%" }}>{children}</table>
            </Box>
          ),
          th: ({ children }) => <th style={{ border: "1px solid #dee2e6", padding: 8, textAlign: "left" }}>{children}</th>,
          td: ({ children }) => <td style={{ border: "1px solid #dee2e6", padding: 8 }}>{children}</td>,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </Box>
  );
}
