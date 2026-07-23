import { describe, expect, it, vi } from "vitest";
import type { AuthLike } from "../actions/submit-answer.ts";
import type { QuestionSet } from "../domain/question.ts";
import type { QuestionAccuracy, Store } from "../store.ts";
import { loadSetData } from "./load-set-data.ts";

function makeStore(
  latestAttempts: Map<string, { isCorrect: boolean }> = new Map(),
  accuracy: Map<string, QuestionAccuracy> = new Map(),
): Store {
  return {
    recordAttempt: vi.fn().mockResolvedValue(undefined),
    listLatestAttempts: vi.fn().mockResolvedValue(latestAttempts),
    listAccuracy: vi.fn().mockResolvedValue(accuracy),
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
    questions: [{ id: "q1", question: "Q1", answer: "A1", explanation: null }],
  },
];

describe("loadSetData", () => {
  it("存在しないセットIDならfound:falseを返し、セッション確認しない", async () => {
    const store = makeStore();
    const auth = makeAuth("u1");

    const data = await loadSetData({
      request: new Request("http://localhost/sets/nope"),
      store,
      auth,
      questionSets: sets,
      setId: "nope",
    });

    expect(data).toEqual({ found: false });
    expect(auth.api.getSession).not.toHaveBeenCalled();
  });

  it("セットは存在するが未ログインならfound:true, loggedIn:falseを返す", async () => {
    const store = makeStore();
    const auth = makeAuth(null);

    const data = await loadSetData({
      request: new Request("http://localhost/sets/english/part1"),
      store,
      auth,
      questionSets: sets,
      setId: "english/part1",
    });

    expect(data).toEqual({ found: true, loggedIn: false });
  });

  it("ログイン済みならセット・全セット・両モードの最新回答/正答率を返す", async () => {
    const store = makeStore(
      new Map([["q1", { isCorrect: true }]]),
      new Map([["q1", { total: 2, correct: 1 }]]),
    );
    const auth = makeAuth("u1");

    const data = await loadSetData({
      request: new Request("http://localhost/sets/english/part1"),
      store,
      auth,
      questionSets: sets,
      setId: "english/part1",
    });

    expect(data).toEqual({
      found: true,
      loggedIn: true,
      userId: "u1",
      set: sets[0],
      allSets: sets,
      quizAttempts: [["q1", { isCorrect: true }]],
      flashcardAttempts: [["q1", { isCorrect: true }]],
      quizAccuracy: [["q1", { total: 2, correct: 1 }]],
      flashcardAccuracy: [["q1", { total: 2, correct: 1 }]],
    });
    expect(store.listLatestAttempts).toHaveBeenCalledWith("u1", "quiz");
    expect(store.listLatestAttempts).toHaveBeenCalledWith("u1", "flashcard");
    expect(store.listAccuracy).toHaveBeenCalledWith("u1", "quiz");
    expect(store.listAccuracy).toHaveBeenCalledWith("u1", "flashcard");
  });
});
