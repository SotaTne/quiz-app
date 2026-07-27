import { Button, Group } from "@mantine/core";
import { LogoutButton } from "./logout-button.tsx";

export function AppNavigation({ active }: { active: "quiz" | "paper" }) {
  return (
    <Group justify="space-between" wrap="nowrap">
      <Group gap="xs">
        <Button component="a" href="/" variant={active === "quiz" ? "filled" : "light"}>
          クイズ
        </Button>
        <Button component="a" href="/paper" variant={active === "paper" ? "filled" : "light"}>
          カンペ
        </Button>
      </Group>
      <LogoutButton />
    </Group>
  );
}
