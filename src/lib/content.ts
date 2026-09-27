import "server-only";
import fs from "node:fs";
import path from "node:path";
import type {
  Category,
  CategoryId,
  ExamFormula,
  GlossaryTerm,
  Lang,
  LogicWord,
  Question,
  QuestionTranslation,
  Topic,
} from "./types";

const CONTENT = path.join(process.cwd(), "content");
const cache = new Map<string, unknown>();

function readJson<T>(rel: string): T {
  if (!cache.has(rel)) cache.set(rel, JSON.parse(fs.readFileSync(path.join(CONTENT, rel), "utf8")));
  return cache.get(rel) as T;
}

export function getCategories(): Category[] {
  return readJson<Category[]>("categories.json");
}

export function getCategory(id: string): Category | undefined {
  return getCategories().find((c) => c.id === id);
}

export function getTopics(): Topic[] {
  return [...readJson<Topic[]>("topics.json")].sort((a, b) => a.order - b.order);
}

export function getQuestions(cat: CategoryId): Question[] {
  return readJson<Question[]>(`${cat}/questions.json`);
}

export function getQuestion(cat: CategoryId, number: number): Question | undefined {
  return getQuestions(cat).find((q) => q.number === number);
}

export function getTranslations(cat: CategoryId, lang: Lang): Map<string, QuestionTranslation> {
  if (lang === "es") return new Map();
  const key = `${cat}/i18n/${lang}.json`;
  const file = path.join(CONTENT, key);
  if (!fs.existsSync(file)) return new Map();
  const list = readJson<QuestionTranslation[]>(key);
  return new Map(list.map((t) => [t.id, t]));
}

export function getTranslation(cat: CategoryId, lang: Lang, id: string): QuestionTranslation | undefined {
  return getTranslations(cat, lang).get(id);
}

export function getGlossary(): GlossaryTerm[] {
  return readJson<GlossaryTerm[]>("glossary/terms.json");
}

export function getLogicWords(): LogicWord[] {
  return readJson<LogicWord[]>("glossary/logic.json");
}

export function getFormulas(): ExamFormula[] {
  return readJson<ExamFormula[]>("glossary/formulas.json");
}

export function topicsWithQuestions(cat: CategoryId): Topic[] {
  const used = new Set(getQuestions(cat).map((q) => q.topic));
  return getTopics().filter((t) => used.has(t.id));
}
