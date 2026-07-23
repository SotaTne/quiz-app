import { describe, expect, it, vi } from "vitest";
import type { AuthLike } from "../actions/submit-answer.ts";
import type { QuestionSet } from "../domain/question.ts";
import type { Store } from "../store.ts";
import { loadHomeData } from "./load-home-data.ts";

function makeStore(latestAttempts: Map<string, { isCorrect: boolean }> = new Map()): Store {
  return {
    recordAttempt: vi.fn().mockResolvedValue(undefined),
    listLatestAttempts: vi.fn().mockResolvedValue(latestAttempts),
    listAccuracy: vi.fn().mockResolvedValue(new Map()),
  };
}

function makeAuth(userId: string | null): AuthLike {
  return {
    api: { getSession: vi.fn().mockResolvedValue(userId ? { user: { id: userId } } : null) },
    handler: vi.fn(),
  };
}

const sets: QuestionSet[] = [
  {
    id: "english/part1",
    title: "英語1",
    questions: [
      { id: "q1", question: "Q1", answer: "A1", explanation: null },
      { id: "q2", question: "Q2", answer: "A2", explanation: null },
    ],
  },
];

describe("loadHomeData", () => {
  it("未ログインならloggedIn:falseだけを返す", async () => {
    const store = makeStore();
    const auth = makeAuth(null);

    const data = await loadHomeData({
      request: new Request("http://localhost/"),
      store,
      auth,
      questionSets: sets,
    });

    expect(data).toEqual({ loggedIn: false });
    expect(store.listLatestAttempts).not.toHaveBeenCalled();
  });

  it("未着手のセットはmasteryPercentがnull", async () => {
    const store = makeStore();
    const auth = makeAuth("u1");

    const data = await loadHomeData({
      request: new Request("http://localhost/"),
      store,
      auth,
      questionSets: sets,
    });

    expect(data).toEqual({ loggedIn: true, sets: [{ set: sets[0], masteryPercent: null }] });
  });

  it("一部回答済みなら回答済み分の正答率をmasteryPercentとする", async () => {
    const store = makeStore(new Map([["q1", { isCorrect: true }]]));
    const auth = makeAuth("u1");

    const data = await loadHomeData({
      request: new Request("http://localhost/"),
      store,
      auth,
      questionSets: sets,
    });

    expect(data).toEqual({ loggedIn: true, sets: [{ set: sets[0], masteryPercent: 100 }] });
  });

  it("回答済み分がすべて不正解ならmasteryPercentは0", async () => {
    const store = makeStore(new Map([["q1", { isCorrect: false }]]));
    const auth = makeAuth("u1");

    const data = await loadHomeData({
      request: new Request("http://localhost/"),
      store,
      auth,
      questionSets: sets,
    });

    expect(data).toEqual({ loggedIn: true, sets: [{ set: sets[0], masteryPercent: 0 }] });
  });
});
