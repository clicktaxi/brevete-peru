export function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function slugify(text: string, maxWords = 6): string {
  return fold(text)
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .slice(0, maxWords)
    .join("-");
}

export function questionSlug(number: number, text: string): string {
  return `${number}-${slugify(text)}`;
}

export function pad3(n: number): string {
  return String(n).padStart(3, "0");
}

export function formatClock(totalSec: number): string {
  const m = Math.floor(Math.max(0, totalSec) / 60);
  const s = Math.max(0, totalSec) % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Splits `text` into pieces, marking the ones that match one of `words` (whole words, accent-insensitive). */
export function markWords(text: string, words: string[]): { text: string; hit: boolean }[] {
  if (!words.length) return [{ text, hit: false }];
  const sorted = [...words].sort((a, b) => b.length - a.length).map((w) => fold(w));
  const out: { text: string; hit: boolean }[] = [];
  const folded = fold(text);
  let i = 0;
  let plain = "";
  const isWord = (ch: string | undefined) => !!ch && /[a-z0-9]/.test(ch);
  while (i < folded.length) {
    let matched: string | null = null;
    if (!isWord(folded[i - 1])) {
      for (const w of sorted) {
        if (folded.startsWith(w, i) && !isWord(folded[i + w.length])) {
          matched = w;
          break;
        }
      }
    }
    if (matched) {
      if (plain) out.push({ text: plain, hit: false });
      plain = "";
      out.push({ text: text.slice(i, i + matched.length), hit: true });
      i += matched.length;
    } else {
      plain += text[i];
      i++;
    }
  }
  if (plain) out.push({ text: plain, hit: false });
  return out;
}

/** Word-level diff: returns words of `a` and `b` with a flag telling whether the word is unique to that side. */
export function diffWords(a: string, b: string): { a: { w: string; diff: boolean }[]; b: { w: string; diff: boolean }[] } {
  const wa = a.split(/\s+/);
  const wb = b.split(/\s+/);
  const setA = new Set(wa.map((w) => fold(w).replace(/[^a-z0-9]/g, "")));
  const setB = new Set(wb.map((w) => fold(w).replace(/[^a-z0-9]/g, "")));
  const key = (w: string) => fold(w).replace(/[^a-z0-9]/g, "");
  return {
    a: wa.map((w) => ({ w, diff: !setB.has(key(w)) })),
    b: wb.map((w) => ({ w, diff: !setA.has(key(w)) })),
  };
}

export function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const rng = mulberry32(seed);
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}
