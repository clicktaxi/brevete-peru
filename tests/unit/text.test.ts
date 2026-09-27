import { describe, expect, it } from "vitest";
import { diffWords, fold, markWords, questionSlug, shuffleWithSeed } from "@/lib/text";

describe("text helpers", () => {
  it("folds accents and case", () => {
    expect(fold("Señal Reglamentaria")).toBe("senal reglamentaria");
  });

  it("builds stable question slugs", () => {
    expect(questionSlug(1, "Está permitido en la vía:")).toBe("1-esta-permitido-en-la-via");
  });

  it("marks whole words accent-insensitively", () => {
    const parts = markWords("Solo los conductores están obligados", ["solo", "obligado"]);
    expect(parts.filter((p) => p.hit).map((p) => p.text)).toEqual(["Solo"]);
    expect(parts.map((p) => p.text).join("")).toBe("Solo los conductores están obligados");
  });

  it("diffs words on both sides", () => {
    const d = diffWords("Está prohibido girar", "Está permitido girar");
    expect(d.a.filter((w) => w.diff).map((w) => w.w)).toEqual(["prohibido"]);
    expect(d.b.filter((w) => w.diff).map((w) => w.w)).toEqual(["permitido"]);
  });

  it("shuffles deterministically", () => {
    const a = shuffleWithSeed([1, 2, 3, 4, 5, 6], 42);
    expect(shuffleWithSeed([1, 2, 3, 4, 5, 6], 42)).toEqual(a);
    expect([...a].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
