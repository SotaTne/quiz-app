import { describe, expect, it } from "vitest";
import { createDb } from "./client";

describe("createDb", () => {
  it("D1Databaseからクエリビルダを持つDrizzleインスタンスを組み立てる", () => {
    // drizzle(d1, ...)はクエリを実行するまでd1に触れないので、フェイクのD1でも構築だけは確認できる。
    const fakeD1 = {} as D1Database;

    const db = createDb(fakeD1);

    expect(db.select).toBeTypeOf("function");
    expect(db.insert).toBeTypeOf("function");
  });
});
