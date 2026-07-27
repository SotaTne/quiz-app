import { describe, expect, it, vi } from "vitest";
import type { Paper } from "../domain/paper.ts";
import { loadPaperData, loadPaperListData } from "./load-paper-data.ts";

const papers: Paper[] = [
  { id: "one", title: "One", description: null, order: 0, markdown: "# One" },
];

const auth = (session: unknown) => ({
  api: { getSession: vi.fn().mockResolvedValue(session) },
  handler: vi.fn(),
});

describe("paper loaders", () => {
  it("未ログインでは本文を返さない", async () => {
    await expect(loadPaperData({ request: new Request("https://example.com"), auth: auth(null), papers, paperId: "one" }))
      .resolves.toEqual({ found: true, loggedIn: false });
  });

  it("ログイン済みなら一覧を返す", async () => {
    await expect(loadPaperListData({
      request: new Request("https://example.com"),
      auth: auth({ user: { id: "u1" } }),
      papers,
    })).resolves.toEqual({ loggedIn: true, papers });
  });

  it("ログイン済みなら指定した本文を返す", async () => {
    await expect(loadPaperData({
      request: new Request("https://example.com"),
      auth: auth({ user: { id: "u1" } }),
      papers,
      paperId: "one",
    })).resolves.toEqual({ found: true, loggedIn: true, paper: papers[0] });
  });
});
