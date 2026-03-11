import { describe, expect, it } from "vitest";

describe("render-worker", () => {
  it("keeps a deterministic default port", () => {
    expect(Number(process.env.PORT ?? 4001)).toBe(4001);
  });
});
