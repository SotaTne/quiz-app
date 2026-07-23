import type { Mode } from "../domain/attempt.ts";

export type SubmitAnswerClientInput = {
  userId: string;
  questionId: string;
  mode: Mode;
  isCorrect: boolean;
};

type QueuedEntry = SubmitAnswerClientInput & { id: string };

const queueKey = (userId: string) => `quiz:pending-attempts:${userId}`;

function readQueue(userId: string): QueuedEntry[] {
  try {
    const raw = localStorage.getItem(queueKey(userId));
    return raw ? (JSON.parse(raw) as QueuedEntry[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(userId: string, queue: QueuedEntry[]): void {
  localStorage.setItem(queueKey(userId), JSON.stringify(queue));
}

async function send(entry: QueuedEntry): Promise<"ok" | "retry" | "discard"> {
  try {
    const res = await fetch("/api/submit-answer", {
      method: "POST",
      keepalive: true,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(entry),
    });
    if (res.ok) return "ok";
    // 401/400/422: 再送しても解決しないので破棄。5xxのみ再送対象(submit-answer.ts参照)。
    return res.status >= 500 ? "retry" : "discard";
  } catch {
    return "retry";
  }
}

/** 未送信キューに残っている回答を再送する。成功/discardした分はキューから取り除く。 */
export async function flushPendingAttempts(userId: string): Promise<void> {
  const queue = readQueue(userId);
  if (queue.length === 0) return;

  const remaining: QueuedEntry[] = [];
  for (const entry of queue) {
    if ((await send(entry)) === "retry") remaining.push(entry);
  }
  writeQueue(userId, remaining);
}

/** 1件の回答を送信する。5xx・ネットワーク断ならlocalStorageに積んで次回のflushPendingAttemptsに任せる。 */
export async function submitAnswer(input: SubmitAnswerClientInput): Promise<void> {
  const entry: QueuedEntry = { ...input, id: crypto.randomUUID() };
  if ((await send(entry)) === "retry") {
    writeQueue(input.userId, [...readQueue(input.userId), entry]);
  }
}
