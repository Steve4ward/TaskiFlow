import { describe, it, expect } from "vitest";
import { applyPatch } from "@/lib/forms";

describe("applyPatch", () => {
  it("applies allowed keys", () => {
    const current = { a: 1, b: 2 };
    const patch = { a: 5, c: 9 };
    const next = applyPatch(current, patch, new Set(["a"]));
    expect(next).toEqual({ a: 5, b: 2 });
  });
});
