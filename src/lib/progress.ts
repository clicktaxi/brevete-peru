"use client";

import { createStore, del, get, keys, set, type UseStore } from "idb-keyval";
import type { ExamAttempt } from "./exam";
import type { Lang, OptionKey } from "./types";

import { STEP_IDS, STEP_THRESHOLD, STEP_WINDOW, type StepId } from "./steps";
import type { VocabWordStats } from "./vocab";

export type HelpLevel = 1 | 2 | 3 | 4;
export { STEP_IDS, STEP_THRESHOLD, STEP_WINDOW, type StepId };

export interface QuestionStats {
  seen: number;
  correctCount: number;
  wrongCount: number;
  streak: number;
  lastAnswer?: OptionKey;
  lastAt?: number;
  starred?: boolean;
  srs?: SrsState;
}

/** SM-2 state: interval in days, due as a timestamp. */
export interface SrsState {
  ease: number;
  interval: number;
  due: number;
  reps?: number;
}

const DAY = 86_400_000;

export function nextSrs(prev: SrsState | undefined, quality: number, now = Date.now()): SrsState {
  const ease = prev?.ease ?? 2.5;
  const reps = prev?.reps ?? 0;
  if (quality < 3) return { ease: Math.max(1.3, ease - 0.2), interval: 1, reps: 0, due: now + DAY };
  const newEase = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  const interval = reps === 0 ? 1 : reps === 1 ? 6 : Math.round((prev?.interval ?? 1) * newEase);
  return { ease: newEase, interval, reps: reps + 1, due: now + interval * DAY };
}

export function isDue(s: QuestionStats | undefined, now = Date.now()): boolean {
  return !!s?.srs && s.srs.due <= now;
}

/** Daily portion: due questions first (oldest due first), then unseen ones, up to `limit`. */
export function dailyPortion(ids: string[], stats: Record<string, QuestionStats>, limit: number, now = Date.now()): string[] {
  const due = ids.filter((id) => isDue(stats[id], now)).sort((a, b) => stats[a].srs!.due - stats[b].srs!.due);
  const fresh = ids.filter((id) => !stats[id]?.seen);
  return [...due, ...fresh].slice(0, limit);
}

export interface Settings {
  helpLevel: HelpLevel;
  shuffleOptions: boolean;
  theme: "system" | "light" | "dark";
  speechRate: 0.7 | 1;
}

export interface TopicProgress {
  /** per step: last answers, true = correct (words step stores viewed card ids instead) */
  steps: Partial<Record<StepId, boolean[]>>;
  wordsSeen: string[];
}

export interface ProgressExport {
  version: 1;
  exportedAt: number;
  questions: Record<string, QuestionStats>;
  attempts: ExamAttempt[];
  topics: Record<string, TopicProgress>;
  settings: Settings;
  vocab?: Record<string, VocabWordStats>;
}

const DEFAULT_SETTINGS: Settings = { helpLevel: 1, shuffleOptions: false, theme: "system", speechRate: 1 };

let store: UseStore | null = null;
const memory = new Map<string, unknown>();
const BACKUP_PREFIX = "brevete:";

function getStore(): UseStore | null {
  if (store) return store;
  try {
    if (typeof indexedDB === "undefined") return null;
    store = createStore("brevete", "progress");
    return store;
  } catch {
    return null;
  }
}

// localStorage keeps a mirror so that progress survives if IndexedDB is wiped or unavailable.
function backupRead<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(BACKUP_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}

function backupWrite<T>(key: string, value: T | undefined): void {
  try {
    if (value === undefined) localStorage.removeItem(BACKUP_PREFIX + key);
    else localStorage.setItem(BACKUP_PREFIX + key, JSON.stringify(value));
  } catch {
    /* quota or private mode */
  }
}

let persistRequested = false;
export function requestPersistentStorage(): void {
  if (persistRequested) return;
  persistRequested = true;
  try {
    void navigator.storage?.persist?.();
  } catch {
    /* unsupported */
  }
}

async function read<T>(key: string): Promise<T | undefined> {
  if (memory.has(key)) return memory.get(key) as T;
  const s = getStore();
  let value: T | undefined;
  if (s) {
    try {
      value = await get<T>(key, s);
    } catch {
      /* fall through */
    }
  }
  if (value === undefined) {
    value = backupRead<T>(key);
    if (value !== undefined && s) {
      try {
        await set(key, value, s);
      } catch {
        /* ignore */
      }
    }
  }
  if (value !== undefined) memory.set(key, value);
  return value;
}

async function write<T>(key: string, value: T): Promise<void> {
  memory.set(key, value);
  backupWrite(key, value);
  const s = getStore();
  if (s) {
    try {
      await set(key, value, s);
    } catch {
      /* backup only */
    }
  }
}

async function remove(key: string): Promise<void> {
  memory.delete(key);
  backupWrite(key, undefined);
  const s = getStore();
  if (s) {
    try {
      await del(key, s);
    } catch {
      /* ignore */
    }
  }
}

async function allKeys(): Promise<string[]> {
  const s = getStore();
  if (s) {
    try {
      return (await keys(s)).map(String);
    } catch {
      /* fall through */
    }
  }
  return [...memory.keys()];
}

const qKey = (cat: string) => `q:${cat}`;
const attemptsKey = (cat: string) => `attempts:${cat}`;
const activeKey = (cat: string) => `active:${cat}`;
const topicsKey = (cat: string) => `topics:${cat}`;

export async function getQuestionStats(cat: string): Promise<Record<string, QuestionStats>> {
  return (await read<Record<string, QuestionStats>>(qKey(cat))) ?? {};
}

export function isLearned(s: QuestionStats | undefined): boolean {
  return !!s && s.streak >= 2;
}

export function isMistake(s: QuestionStats | undefined): boolean {
  return !!s && s.wrongCount > 0 && s.streak < 2;
}

export async function recordAnswer(
  cat: string,
  id: string,
  answer: OptionKey,
  correct: boolean,
  opts: { withHelp?: boolean } = {},
): Promise<QuestionStats> {
  const all = await getQuestionStats(cat);
  const s: QuestionStats = all[id] ?? { seen: 0, correctCount: 0, wrongCount: 0, streak: 0 };
  s.seen++;
  s.lastAnswer = answer;
  s.lastAt = Date.now();
  if (correct) {
    s.correctCount++;
    if (!opts.withHelp) s.streak++;
  } else {
    s.wrongCount++;
    s.streak = 0;
  }
  const quality = !correct ? 1 : opts.withHelp ? 3 : s.streak >= 2 ? 5 : 4;
  s.srs = nextSrs(s.srs, quality);
  all[id] = s;
  await write(qKey(cat), all);
  return s;
}

export async function markSeen(cat: string, id: string): Promise<void> {
  const all = await getQuestionStats(cat);
  const s = all[id] ?? { seen: 0, correctCount: 0, wrongCount: 0, streak: 0 };
  s.seen++;
  all[id] = s;
  await write(qKey(cat), all);
}

export async function toggleStar(cat: string, id: string): Promise<boolean> {
  const all = await getQuestionStats(cat);
  const s = all[id] ?? { seen: 0, correctCount: 0, wrongCount: 0, streak: 0 };
  s.starred = !s.starred;
  all[id] = s;
  await write(qKey(cat), all);
  return s.starred;
}

export async function getSettings(): Promise<Settings> {
  return { ...DEFAULT_SETTINGS, ...((await read<Partial<Settings>>("settings")) ?? {}) };
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch };
  await write("settings", next);
  return next;
}

export function defaultHelpLevel(lang: Lang): HelpLevel {
  return lang === "es" ? 4 : 1;
}

export async function getAttempts(cat: string): Promise<ExamAttempt[]> {
  return (await read<ExamAttempt[]>(attemptsKey(cat))) ?? [];
}

export async function getAttempt(cat: string, id: string): Promise<ExamAttempt | undefined> {
  const active = await getActiveAttempt(cat);
  if (active?.id === id) return active;
  return (await getAttempts(cat)).find((a) => a.id === id);
}

export async function saveFinishedAttempt(cat: string, attempt: ExamAttempt): Promise<void> {
  const list = (await getAttempts(cat)).filter((a) => a.id !== attempt.id);
  list.push(attempt);
  await write(attemptsKey(cat), list);
  await remove(activeKey(cat));
}

export async function getActiveAttempt(cat: string): Promise<ExamAttempt | undefined> {
  return read<ExamAttempt>(activeKey(cat));
}

export async function saveActiveAttempt(cat: string, attempt: ExamAttempt): Promise<void> {
  await write(activeKey(cat), attempt);
}

export async function discardActiveAttempt(cat: string): Promise<void> {
  await remove(activeKey(cat));
}

export async function getTopicProgress(cat: string): Promise<Record<string, TopicProgress>> {
  return (await read<Record<string, TopicProgress>>(topicsKey(cat))) ?? {};
}

export async function recordStepAnswer(cat: string, topic: string, step: StepId, correct: boolean): Promise<TopicProgress> {
  const all = await getTopicProgress(cat);
  const tp = (all[topic] ??= { steps: {}, wordsSeen: [] });
  const list = (tp.steps[step] ??= []);
  list.push(correct);
  if (list.length > STEP_WINDOW) list.splice(0, list.length - STEP_WINDOW);
  await write(topicsKey(cat), all);
  return tp;
}

export async function recordWordSeen(cat: string, topic: string, termId: string): Promise<TopicProgress> {
  const all = await getTopicProgress(cat);
  const tp = (all[topic] ??= { steps: {}, wordsSeen: [] });
  if (!tp.wordsSeen.includes(termId)) tp.wordsSeen.push(termId);
  await write(topicsKey(cat), all);
  return tp;
}

export function stepAccuracy(tp: TopicProgress | undefined, step: StepId): { rate: number; count: number } {
  const list = tp?.steps[step] ?? [];
  if (!list.length) return { rate: 0, count: 0 };
  return { rate: list.filter(Boolean).length / list.length, count: list.length };
}

export function stepDone(tp: TopicProgress | undefined, step: StepId, wordsTotal: number): boolean {
  if (step === "words") return wordsTotal === 0 || (tp?.wordsSeen.length ?? 0) >= wordsTotal;
  const { rate, count } = stepAccuracy(tp, step);
  return count >= Math.min(10, STEP_WINDOW) && rate >= STEP_THRESHOLD[step];
}

export function nextStep(tp: TopicProgress | undefined, wordsTotal: number): StepId | null {
  for (const s of STEP_IDS) if (!stepDone(tp, s, wordsTotal)) return s;
  return null;
}

const VOCAB_KEY = "vocab";

export async function getVocabStats(): Promise<Record<string, VocabWordStats>> {
  return (await read<Record<string, VocabWordStats>>(VOCAB_KEY)) ?? {};
}

export async function recordVocab(id: string, correct: boolean): Promise<VocabWordStats> {
  const all = await getVocabStats();
  const prev = all[id];
  const srs = nextSrs(prev ? { ease: prev.ease, interval: prev.interval, due: prev.due, reps: prev.reps } : undefined, correct ? 4 : 1);
  const next: VocabWordStats = {
    correct: (prev?.correct ?? 0) + (correct ? 1 : 0),
    wrong: (prev?.wrong ?? 0) + (correct ? 0 : 1),
    reps: srs.reps ?? 0,
    ease: srs.ease,
    interval: srs.interval,
    due: srs.due,
  };
  all[id] = next;
  await write(VOCAB_KEY, all);
  return next;
}

export async function exportProgress(cats: string[]): Promise<ProgressExport> {
  const questions: Record<string, QuestionStats> = {};
  const attempts: ExamAttempt[] = [];
  const topics: Record<string, TopicProgress> = {};
  for (const cat of cats) {
    for (const [id, s] of Object.entries(await getQuestionStats(cat))) questions[id] = s;
    attempts.push(...(await getAttempts(cat)));
    for (const [id, tp] of Object.entries(await getTopicProgress(cat))) topics[`${cat}:${id}`] = tp;
  }
  return { version: 1, exportedAt: Date.now(), questions, attempts, topics, settings: await getSettings(), vocab: await getVocabStats() };
}

export async function importProgress(data: ProgressExport, cats: string[]): Promise<void> {
  if (data.version !== 1) throw new Error("unsupported version");
  for (const cat of cats) {
    const qs: Record<string, QuestionStats> = {};
    for (const [id, s] of Object.entries(data.questions ?? {})) if (id.startsWith(`${cat}-`)) qs[id] = s;
    await write(qKey(cat), qs);
    await write(
      attemptsKey(cat),
      (data.attempts ?? []).filter((a) => a.category === cat),
    );
    const tps: Record<string, TopicProgress> = {};
    for (const [key, tp] of Object.entries(data.topics ?? {})) {
      if (key.startsWith(`${cat}:`)) tps[key.slice(cat.length + 1)] = tp;
    }
    await write(topicsKey(cat), tps);
  }
  if (data.settings) await write("settings", { ...DEFAULT_SETTINGS, ...data.settings });
  if (data.vocab) await write(VOCAB_KEY, data.vocab);
}

export async function resetProgress(): Promise<void> {
  for (const k of await allKeys()) await remove(k);
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith(BACKUP_PREFIX)) localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
  memory.clear();
}
