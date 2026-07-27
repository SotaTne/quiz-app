import { Anchor, Stack, Text } from "@mantine/core";
import type { PaperData } from "./load-paper-data.ts";
import { AppNavigation } from "./app-navigation.tsx";
import { LoginButton } from "./login-button.tsx";
import { PaperContent } from "./paper-content.tsx";

export function PaperPage({ data }: { data: PaperData }) {
  if (!data.found) return <Text c="dimmed">カンペが見つかりませんでした。</Text>;
  if (!data.loggedIn) {
    return (
      <Stack gap="md" align="flex-start">
        <Text>ログインが必要です。</Text>
        <LoginButton />
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <AppNavigation active="paper" />
      <Anchor href="/paper" size="sm">カンペ一覧に戻る</Anchor>
      <Text component="h1" fw={700} size="xl" m={0}>{data.paper.title}</Text>
      <PaperContent markdown={data.paper.markdown} />
    </Stack>
  );
}
