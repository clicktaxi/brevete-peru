"use client";

import type { Category, GlossaryTerm, Lang, LogicWord, Question, QuestionTranslation, Topic } from "./types";

export interface CategoryData {
  category: Category;
  topics: Topic[];
  questions: Question[];
  translations: Record<string, QuestionTranslation>;
}

export interface GlossaryData {
  terms: GlossaryTerm[];
  logic: LogicWord[];
}

const cache = new Map<string, Promise<unknown>>();

async function fetchJson<T>(url: string): Promise<T> {
  if (!cache.has(url)) {
    cache.set(
      url,
      fetch(url).then((r) => {
        if (!r.ok) throw new Error(`${url}: ${r.status}`);
        return r.json();
      }),
    );
  }
  return cache.get(url) as Promise<T>;
}

export function categoryDataUrl(cat: string, lang: Lang): string {
  return `/data/${cat}.${lang}.json`;
}

export function loadCategoryData(cat: string, lang: Lang): Promise<CategoryData> {
  return fetchJson<CategoryData>(categoryDataUrl(cat, lang));
}

export function loadGlossary(): Promise<GlossaryData> {
  return fetchJson<GlossaryData>("/data/glossary.json");
}
