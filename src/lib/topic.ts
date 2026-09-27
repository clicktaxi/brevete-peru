import type { GlossaryTerm, Question } from "./types";

export const TOPIC_WORDS_MAX = 20;

/** Glossary terms of a topic ordered by how many of its questions use them (max 20). */
export function topicTerms(questions: Question[], topicId: string, glossary: GlossaryTerm[]): GlossaryTerm[] {
  const counts = new Map<string, number>();
  for (const q of questions) {
    if (q.topic !== topicId) continue;
    for (const id of q.terms) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const byId = new Map(glossary.map((g) => [g.id, g]));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id]) => byId.get(id))
    .filter((g): g is GlossaryTerm => !!g)
    .slice(0, TOPIC_WORDS_MAX);
}

export function topicTermCount(questions: Question[], topicId: string): number {
  const ids = new Set(questions.filter((q) => q.topic === topicId).flatMap((q) => q.terms));
  return Math.min(ids.size, TOPIC_WORDS_MAX);
}
