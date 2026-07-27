import { Stack, Text } from "@mantine/core";
import { AppNavigation } from "./app-navigation.tsx";
import type { HomeData } from "./load-home-data.ts";
import { LoginButton } from "./login-button.tsx";
import { SetListView } from "./set-list-view.tsx";

export type HomePageProps = {
  data: HomeData;
};

/** ルート("/")の見た目。未ログインならログイン導線のみ、ログイン済みならセット一覧+習熟度を表示する。 */
export function HomePage({ data }: HomePageProps) {
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
      <AppNavigation active="quiz" />
      <SetListView sets={data.sets} />
    </Stack>
  );
}
