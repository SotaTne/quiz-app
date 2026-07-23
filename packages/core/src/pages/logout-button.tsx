import { Button } from "@mantine/core";

export function LogoutButton() {
  async function handleClick() {
    // content-typeなしだとbetter-auth側が415を返す(空bodyでもJSONとして扱われるため必須)。
    await fetch("/api/auth/sign-out", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    window.location.href = "/";
  }

  return (
    <Button variant="subtle" color="gray" onClick={handleClick}>
      ログアウト
    </Button>
  );
}
