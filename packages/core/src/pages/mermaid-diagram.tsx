import { Alert, Box } from "@mantine/core";
import { useEffect, useId, useState } from "react";

export function MermaidDiagram({ source }: { source: string }) {
  const reactId = useId();
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const id = `mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

    void import("mermaid")
      .then(async ({ default: mermaid }) => {
        mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "neutral" });
        const rendered = await mermaid.render(id, source);
        if (active) setSvg(rendered.svg);
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, [reactId, source]);

  if (error) return <Alert color="red">Mermaid図を描画できませんでした。</Alert>;
  if (!svg) return <Box c="dimmed">図を描画しています…</Box>;

  return <Box my="md" style={{ overflowX: "auto" }} dangerouslySetInnerHTML={{ __html: svg }} />;
}
