import { Card, Stack, Text } from "@mantine/core";
import type { PaperListData } from "./load-paper-data.ts";
import { AppNavigation } from "./app-navigation.tsx";
import { LoginButton } from "./login-button.tsx";

export function PaperListPage({ data }: { data: PaperListData }) {
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
      <Text fw={700} size="xl">カンペ</Text>
      {data.papers.length === 0 ? (
        <Text c="dimmed">まだカンペがありません。content/paper/にMarkdownを追加してください。</Text>
      ) : (
        <Stack gap="sm">
          {data.papers.map((paper) => (
            <Card key={paper.id} component="a" href={`/paper/${paper.id}`} withBorder radius="md" padding="md">
              <Text fw={600}>{paper.title}</Text>
              {paper.description && <Text size="sm" c="dimmed" mt={4}>{paper.description}</Text>}
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
