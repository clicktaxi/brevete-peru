import { describe, expect, it } from "vitest";
import { buildPool, canAssemble, choiceOptions, exerciseFor, isCorrectTyping, letterTiles, pickSession, wordShape, type VocabWord } from "@/lib/vocab";
import type { GlossaryTerm, LogicWord } from "@/lib/types";

const terms: GlossaryTerm[] = [
  { id: "berma", es: "berma", tr: { ru: "обочина", en: "shoulder" } },
  { id: "ceder-el-paso", es: "ceder el paso", tr: { ru: "уступить дорогу", en: "give way" } },
  { id: "maquinaria-agricola", es: "maquinaria agrícola", tr: { ru: "сельхозтехника", en: "farm machinery" } },
  { id: "calzada", es: "calzada", tr: { ru: "проезжая часть", en: "roadway" } },
  { id: "carril", es: "carril", tr: { ru: "полоса", en: "lane" } },
];
const logic: LogicWord[] = [{ es: "salvo", tr: { ru: "кроме", en: "except" } }];

describe("vocab trainer", () => {
  const pool = buildPool(terms, logic, "ru");

  it("builds the pool from terms and logic words", () => {
    expect(pool).toHaveLength(6);
    expect(pool.find((w) => w.id === "logic:salvo")?.tr).toBe("кроме");
  });

  it("accepts typed answers without accents and case", () => {
    const w = pool.find((x) => x.id === "maquinaria-agricola")!;
    expect(isCorrectTyping("Maquinaria agricola ", w)).toBe(true);
    expect(isCorrectTyping("maquinaria", w)).toBe(false);
  });

  it("assembles tiles that cover the word and keeps the word shape", () => {
    const w = pool.find((x) => x.id === "ceder-el-paso")!;
    expect(canAssemble(w)).toBe(true);
    expect(wordShape(w)).toEqual([5, 2, 4]);
    expect(letterTiles(w, 3).map((tl) => tl.ch).sort().join("")).toBe("cederelpaso".split("").sort().join(""));
    expect(canAssemble(pool.find((x) => x.id === "maquinaria-agricola")!)).toBe(false);
  });

  it("offers four distinct options including the word", () => {
    const w = pool[0];
    const opts = choiceOptions(w, pool, 5, "tr");
    expect(opts).toHaveLength(4);
    expect(opts.some((o) => o.id === w.id)).toBe(true);
    expect(new Set(opts.map((o) => o.tr)).size).toBe(4);
  });

  it("puts due words first and falls back to typing for long words", () => {
    const now = 1_000_000;
    const stats = { calzada: { correct: 1, wrong: 0, reps: 1, ease: 2.5, interval: 1, due: now - 1 } };
    const session = pickSession(pool, stats, 3, 1, now);
    expect(session[0].id).toBe("calzada");
    const long: VocabWord = pool.find((x) => x.id === "maquinaria-agricola")!;
    expect(exerciseFor("letters", long, undefined, 0)).toBe("typing");
    expect(exerciseFor("mix", pool[0], undefined, 0)).toBe("choice");
  });
});
