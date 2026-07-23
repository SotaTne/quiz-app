import { Anchor, Container, Title } from "@mantine/core";
import type { ReactNode } from "react";

/** 全ページ共通のヘッダー。装飾は最小限、アクセントカラーは1色だけ(SPEC.md UI方針)。 */
export function RootLayout({ children }: { children: ReactNode }) {
  return (
    <Container size="sm" py="xl">
      <Anchor href="/" underline="never" c="black" mb="xl" display="inline-block">
        <Title order={3}>クイズ</Title>
      </Anchor>
      {children}
    </Container>
  );
}
