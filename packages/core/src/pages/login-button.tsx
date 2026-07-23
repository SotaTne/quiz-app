import { Button } from "@mantine/core";

/** Googleログインを開始する。better-authの/sign-in/socialはPOST専用なのでリンクではなくfetchで叩く。 */
export function LoginButton() {
  async function handleClick() {
    const res = await fetch("/api/auth/sign-in/social", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ provider: "google", callbackURL: "/" }),
    });
    const data = (await res.json()) as { url: string };
    window.location.href = data.url;
  }

  return <Button onClick={handleClick}>Googleでログイン</Button>;
}
