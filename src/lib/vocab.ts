import { fold, mulberry32, shuffleWithSeed } from "./text";
import type { GlossaryTerm, Lang, LogicWord } from "./types";

export type ExerciseType = "choice" | "reverse" | "letters" | "typing";
export type VocabMode = ExerciseType | "mix";
export const EXERCISE_TYPES: ExerciseType[] = ["choice", "reverse", "letters", "typing"];
export const VOCAB_MODES: VocabMode[] = ["mix", ...EXERCISE_TYPES];
export const SESSION_SIZE = 10;
/** A word counts as learned after this many spaced correct answers in a row. */
export const VOCAB_LEARNED_REPS = 3;
export const MAX_LETTER_TILES = 14;

export interface VocabWord {
  id: string;
  es: string;
  tr: string;
  note?: string;
  kind: "term" | "logic";
}

export interface VocabWordStats {
  correct: number;
  wrong: number;
  reps: number;
  ease: number;
  interval: number;
  due: number;
}

export function buildPool(terms: GlossaryTerm[], logic: LogicWord[], lang: Lang): VocabWord[] {
  const pool: VocabWord[] = [];
  for (const t of terms) {
    const tr = t.tr[lang];
    if (tr) pool.push({ id: t.id, es: t.es, tr, note: t.note?.[lang], kind: "term" });
  }
  for (const w of logic) {
    const tr = w.tr[lang];
    if (tr) pool.push({ id: `logic:${w.es}`, es: w.es, tr, note: w.note?.[lang], kind: "logic" });
  }
  return pool;
}

/** Due words first, then the least-practised ones, then new ones. */
export function pickSession(pool: VocabWord[], stats: Record<string, VocabWordStats>, size: number, seed: number, now = Date.now()): VocabWord[] {
  const shuffled = shuffleWithSeed(pool, seed);
  const due = shuffled.filter((w) => stats[w.id] && stats[w.id].due <= now).sort((a, b) => stats[a.id].due - stats[b.id].due);
  const fresh = shuffled.filter((w) => !stats[w.id]);
  const rest = shuffled.filter((w) => stats[w.id] && stats[w.id].due > now).sort((a, b) => stats[a.id].reps - stats[b.id].reps);
  return [...due, ...fresh, ...rest].slice(0, size);
}

export function canAssemble(word: VocabWord): boolean {
  return word.es.replace(/\s/g, "").length <= MAX_LETTER_TILES;
}

/** Progressive difficulty for the mix mode: recognise first, produce later. */
export function exerciseFor(mode: VocabMode, word: VocabWord, stats: VocabWordStats | undefined, index: number): ExerciseType {
  if (mode !== "mix") return mode === "letters" && !canAssemble(word) ? "typing" : mode;
  const reps = stats?.reps ?? 0;
  const ladder: ExerciseType[] = reps === 0 ? ["choice", "reverse"] : reps === 1 ? ["reverse", "letters"] : ["letters", "typing"];
  const t = ladder[index % ladder.length];
  return t === "letters" && !canAssemble(word) ? "typing" : t;
}

export function choiceOptions(word: VocabWord, pool: VocabWord[], seed: number, side: "es" | "tr"): VocabWord[] {
  const key = (w: VocabWord) => fold(w[side]);
  const others = shuffleWithSeed(
    pool.filter((w) => w.id !== word.id && key(w) !== key(word)),
    seed,
  );
  const distinct: VocabWord[] = [];
  for (const w of others) {
    if (distinct.every((d) => key(d) !== key(w))) distinct.push(w);
    if (distinct.length === 3) break;
  }
  return shuffleWithSeed([word, ...distinct], seed + 1);
}

export function normalizeAnswer(s: string): string {
  return fold(s).replace(/[^a-z0-9ñ\s]/g, "").replace(/\s+/g, " ").trim();
}

export function isCorrectTyping(answer: string, word: VocabWord): boolean {
  return normalizeAnswer(answer) === normalizeAnswer(word.es);
}

export interface LetterTile {
  id: number;
  ch: string;
}

export function letterTiles(word: VocabWord, seed: number): LetterTile[] {
  const letters = word.es.replace(/\s/g, "").split("");
  const rng = mulberry32(seed);
  const tiles = letters.map((ch, id) => ({ id, ch }));
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  return tiles;
}

/** Word shape with spaces so the user sees where words split: "ceder el paso" -> [5, 2, 4] */
export function wordShape(word: VocabWord): number[] {
  return word.es.split(/\s+/).map((w) => w.length);
}
