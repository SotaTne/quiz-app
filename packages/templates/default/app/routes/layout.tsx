import { RootLayout } from "@quiz/core";
import { Outlet } from "react-router";

export default function Layout() {
  return (
    <RootLayout>
      <Outlet />
    </RootLayout>
  );
}
