import { describe, expect, it } from "vitest";
import { isEmailAllowed } from "./is-email-allowed";

describe("isEmailAllowed", () => {
  const allowedEmails = ["allow@example.com"];

  it("許可リストにあるメールアドレスはtrue", () => {
    expect(isEmailAllowed("allow@example.com", allowedEmails)).toBe(true);
  });

  it("許可リストにないメールアドレスはfalse", () => {
    expect(isEmailAllowed("deny@example.com", allowedEmails)).toBe(false);
  });

  it("大文字小文字の違いは無視する", () => {
    expect(isEmailAllowed("Allow@Example.com", allowedEmails)).toBe(true);
  });

  it("許可リストが空なら誰も通さない", () => {
    expect(isEmailAllowed("allow@example.com", [])).toBe(false);
  });
});
