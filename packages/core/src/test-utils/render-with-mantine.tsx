import { MantineProvider } from "@mantine/core";
import { render, type RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";

// jsdomはmatchMediaを実装しておらず、MantineProviderの配色スキーム検出がこれを呼ぶため落ちる。
// テスト環境でのみ最小限のダミー実装を用意する。
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

/** MantineコンポーネントはMantineProvider配下でないとテーマ参照時にthrowするため、testing-libraryのrenderをラップする。 */
export function renderWithMantine(ui: ReactElement): RenderResult {
  return render(<MantineProvider>{ui}</MantineProvider>);
}
