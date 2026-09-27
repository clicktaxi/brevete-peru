"use client";

import { createStore, del, get, keys, set, type UseStore } from "idb-keyval";
import type { ExamAttempt } from "./exam";
import type { Lang, OptionKey } from "./types";

import { STEP_IDS, STEP_THRESHOLD, STEP_WINDOW, type StepId } from "./steps";

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
  srs?: { ease: number; interval: number; due: number };
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
}

const DEFAULT_SETTINGS: Settings = { helpLevel: 1, shuffleOptions: false, theme: "system", speechRate: 1 };

let store: UseStore | null = null;
const memory = new Map<string, unknown>();

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

async function read<T>(key: string): Promise<T | undefined> {
  const s = getStore();
  if (s) {
    try {
      return await get<T>(key, s);
    } catch {
      /* fall through */
    }
  }
  return memory.get(key) as T | undefined;
}

async function write<T>(key: string, value: T): Promise<void> {
  memory.set(key, value);
  const s = getStore();
  if (s) {
    try {
      await set(key, value, s);
    } catch {
      /* memory only */
    }
  }
}

async function remove(key: string): Promise<void> {
  memory.delete(key);
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

export async function exportProgress(cats: string[]): Promise<ProgressExport> {
  const questions: Record<string, QuestionStats> = {};
  const attempts: ExamAttempt[] = [];
  const topics: Record<string, TopicProgress> = {};
  for (const cat of cats) {
    for (const [id, s] of Object.entries(await getQuestionStats(cat))) questions[id] = s;
    attempts.push(...(await getAttempts(cat)));
    for (const [id, tp] of Object.entries(await getTopicProgress(cat))) topics[`${cat}:${id}`] = tp;
  }
  return { version: 1, exportedAt: Date.now(), questions, attempts, topics, settings: await getSettings() };
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
}

export async function resetProgress(): Promise<void> {
  for (const k of await allKeys()) await remove(k);
}
