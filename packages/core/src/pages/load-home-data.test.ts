import { describe, expect, it, vi } from "vitest";
import type { AuthLike } from "../actions/submit-answer.ts";
import type { Mode } from "../domain/attempt.ts";
import type { QuestionSet } from "../domain/question.ts";
import type { Store } from "../store.ts";
import { loadHomeData } from "./load-home-data.ts";

function makeStore(
  attemptsByMode: Partial<Record<Mode, Map<string, { isCorrect: boolean }>>> = {},
): Store {
  return {
    recordAttempt: vi.fn().mockResolvedValue(undefined),
    listLatestAttempts: vi.fn((_userId: string, mode: Mode) => Promise.resolve(attemptsByMode[mode] ?? new Map())),
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

  it("未着手のセットは両モードともmasteryPercentがnull", async () => {
    const store = makeStore();
    const auth = makeAuth("u1");

    const data = await loadHomeData({
      request: new Request("http://localhost/"),
      store,
      auth,
      questionSets: sets,
    });

    expect(data).toEqual({
      loggedIn: true,
      sets: [{ set: sets[0], quizMasteryPercent: null, flashcardMasteryPercent: null }],
    });
  });

  it("4択とフラッシュカードで別々に正答率を計算する", async () => {
    const store = makeStore({
      quiz: new Map([["q1", { isCorrect: true }]]),
      flashcard: new Map([
        ["q1", { isCorrect: false }],
        ["q2", { isCorrect: false }],
      ]),
    });
    const auth = makeAuth("u1");

    const data = await loadHomeData({
      request: new Request("http://localhost/"),
      store,
      auth,
      questionSets: sets,
    });

    expect(data).toEqual({
      loggedIn: true,
      sets: [{ set: sets[0], quizMasteryPercent: 100, flashcardMasteryPercent: 0 }],
    });
  });
});
