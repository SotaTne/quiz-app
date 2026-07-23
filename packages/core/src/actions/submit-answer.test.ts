import { describe, expect, it, vi } from "vitest";
import type { Store } from "../store";
import { submitAnswer } from "./submit-answer";

function makeStore(): Store {
  return {
    recordAttempt: vi.fn().mockResolvedValue(undefined),
    listLatestAttempts: vi.fn().mockResolvedValue(new Map()),
  };
}

function makeAuth(userId: string | null) {
  return {
    api: {
      getSession: vi.fn().mockResolvedValue(userId ? { user: { id: userId } } : null),
    },
  };
}

function request(body: unknown): Request {
  return new Request("http://localhost/api/submit-answer", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("submitAnswer", () => {
  it("未ログインなら401を返し、記録もしない", async () => {
    const store = makeStore();
    const auth = makeAuth(null);

    const response = await submitAnswer(request({ id: "a1", questionId: "q1", mode: "quiz", isCorrect: true }), {
      store,
      auth,
    });

    expect(response.status).toBe(401);
    expect(store.recordAttempt).not.toHaveBeenCalled();
  });

  it("不正なJSONボディなら400を返す", async () => {
    const store = makeStore();
    const auth = makeAuth("u1");
    const badRequest = new Request("http://localhost/api/submit-answer", { method: "POST", body: "not json" });

    const response = await submitAnswer(badRequest, { store, auth });

    expect(response.status).toBe(400);
    expect(store.recordAttempt).not.toHaveBeenCalled();
  });

  it("必須フィールドが不正なら422を返す", async () => {
    const store = makeStore();
    const auth = makeAuth("u1");

    const response = await submitAnswer(request({ id: "", questionId: "q1", mode: "quiz", isCorrect: true }), {
      store,
      auth,
    });

    expect(response.status).toBe(422);
    expect(store.recordAttempt).not.toHaveBeenCalled();
  });

  it("正しいリクエストはセッションのuserIdで記録し、204を返す", async () => {
    const store = makeStore();
    const auth = makeAuth("u1");

    const response = await submitAnswer(request({ id: "a1", questionId: "q1", mode: "quiz", isCorrect: true }), {
      store,
      auth,
    });

    expect(response.status).toBe(204);
    expect(store.recordAttempt).toHaveBeenCalledWith({
      id: "a1",
      userId: "u1",
      questionId: "q1",
      mode: "quiz",
      isCorrect: true,
    });
  });

  it("ボディにuserIdを含めても無視し、セッションのuserIdだけを使う(なりすまし防止)", async () => {
    const store = makeStore();
    const auth = makeAuth("real-user");

    await submitAnswer(
      request({ id: "a1", questionId: "q1", mode: "quiz", isCorrect: true, userId: "someone-else" }),
      { store, auth },
    );

    expect(store.recordAttempt).toHaveBeenCalledWith(expect.objectContaining({ userId: "real-user" }));
  });
});
