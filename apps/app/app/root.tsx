import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { Route } from "./+types/root";

export function meta({}: Route.MetaArgs) {
  return [{ title: "クイズ" }];
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider>{children}</MantineProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "予期しないエラーが発生しました。";

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "エラー";
    details = error.status === 404 ? "ページが見つかりませんでした。" : error.statusText || details;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
  }

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px" }}>
      <h1>{message}</h1>
      <p>{details}</p>
    </main>
  );
}
