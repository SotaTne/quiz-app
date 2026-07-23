import { Stack, Text } from "@mantine/core";
import type { SetData } from "./load-set-data.ts";
import { LoginButton } from "./login-button.tsx";
import { QuizSession } from "./quiz-session.tsx";

export type SetPageProps = {
  data: SetData;
};

/** セット詳細("/sets/*")の見た目。見つからない/未ログインの場合はその旨だけ表示する。 */
export function SetPage({ data }: SetPageProps) {
  if (!data.found) {
    return <Text c="dimmed">セットが見つかりませんでした。</Text>;
  }

  if (!data.loggedIn) {
    return (
      <Stack gap="md" align="flex-start">
        <Text>ログインが必要です。</Text>
        <LoginButton />
      </Stack>
    );
  }

  return (
    <QuizSession
      userId={data.userId}
      set={data.set}
      allSets={data.allSets}
      quizAttempts={data.quizAttempts}
      flashcardAttempts={data.flashcardAttempts}
      quizAccuracy={data.quizAccuracy}
      flashcardAccuracy={data.flashcardAccuracy}
    />
  );
}
