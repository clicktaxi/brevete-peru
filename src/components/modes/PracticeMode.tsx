"use client";

import { useEffect, useMemo, useState } from "react";
import { useLang, useT } from "@/components/providers";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { useCategoryData } from "@/components/quiz/useCategoryData";
import { Loading } from "@/components/ui/Loading";
import { getQuestionStats, isLearned, isMistake, type QuestionStats } from "@/lib/progress";
import { randomSeed, shuffleWithSeed } from "@/lib/text";

interface Filters {
  topic: string;
  onlyNew: boolean;
  onlyMistakes: boolean;
  onlyStarred: boolean;
  onlyImages: boolean;
  shuffle: boolean;
  size: number;
}

const SIZES = [10, 20, 40, 0];

export function PracticeMode({ cat, initialTopic = "" }: { cat: string; initialTopic?: string }) {
  const t = useT();
  const lang = useLang();
  const { data, glossary, error } = useCategoryData(cat);
  const [stats, setStats] = useState<Record<string, QuestionStats>>({});
  const [filters, setFilters] = useState<Filters>({ topic: initialTopic, onlyNew: false, onlyMistakes: false, onlyStarred: false, onlyImages: false, shuffle: true, size: 20 });
  const [session, setSession] = useState<{ ids: string[]; seed: number } | null>(null);

  useEffect(() => {
    getQuestionStats(cat).then(setStats);
  }, [cat, session]);

  const pool = useMemo(() => {
    if (!data) return [];
    return data.questions.filter((q) => {
      const s = stats[q.id];
      if (filters.topic && q.topic !== filters.topic) return false;
      if (filters.onlyNew && s?.seen) return false;
      if (filters.onlyMistakes && !isMistake(s)) return false;
      if (filters.onlyStarred && !s?.starred) return false;
      if (filters.onlyImages && !q.image) return false;
      return true;
    });
  }, [data, stats, filters]);

  if (error || !data || !glossary) return <Loading error={error} />;

  if (session) {
    const byId = new Map(data.questions.map((q) => [q.id, q]));
    const questions = session.ids.map((id) => byId.get(id)!);
    return (
      <QuizRunner
        cat={cat}
        questions={questions}
        translations={data.translations}
        logic={glossary.logic}
        finishedContent={({ restart }) => (
          <div className="mt-4 flex flex-col gap-2">
            <button type="button" onClick={restart} className="h-12 rounded-full bg-accent font-semibold text-white">
              {t("practice.again")}
            </button>
            <button type="button" onClick={() => setSession(null)} className="h-12 rounded-full bg-black/5 font-semibold">
              {t("practice.filters")}
            </button>
          </div>
        )}
      />
    );
  }

  const start = () => {
    const seed = randomSeed();
    let list = filters.shuffle ? shuffleWithSeed(pool, seed) : pool;
    if (filters.size) list = list.slice(0, filters.size);
    setSession({ ids: list.map((q) => q.id), seed });
  };

  const toggle = (key: keyof Filters) => setFilters((f) => ({ ...f, [key]: !f[key] }));
  const learned = data.questions.filter((q) => isLearned(stats[q.id])).length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{t("hub.learned", { learned, total: data.questions.length })}</p>
      <div className="rounded-2xl bg-surface p-4 shadow-sm">
        <label className="block text-sm font-medium">
          {t("practice.topic")}
          <select value={filters.topic} onChange={(e) => setFilters((f) => ({ ...f, topic: e.target.value }))} className="mt-1 h-12 w-full rounded-xl border border-black/10 bg-bg px-3 text-base">
            <option value="">{t("practice.allTopics")}</option>
            {data.topics
              .filter((tp) => data.questions.some((q) => q.topic === tp.id))
              .map((tp) => (
                <option key={tp.id} value={tp.id}>
                  {tp.title[lang]} ({data.questions.filter((q) => q.topic === tp.id).length})
                </option>
              ))}
          </select>
        </label>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(
            [
              ["onlyNew", t("practice.onlyNew")],
              ["onlyMistakes", t("practice.onlyMistakes")],
              ["onlyStarred", t("practice.onlyStarred")],
              ["onlyImages", t("practice.onlyImages")],
              ["shuffle", t("practice.shuffle")],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              aria-pressed={filters[key]}
              className={`h-11 rounded-xl px-3 text-sm font-medium ${filters[key] ? "bg-accent text-white" : "bg-black/5"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-3">
          <span className="text-sm font-medium">{t("practice.sessionSize")}</span>
          <div className="mt-1 flex gap-2">
            {SIZES.map((n) => (
              <button key={n} type="button" onClick={() => setFilters((f) => ({ ...f, size: n }))} className={`h-11 flex-1 rounded-xl text-sm font-semibold ${filters.size === n ? "bg-accent text-white" : "bg-black/5"}`}>
                {n || t("common.all")}
              </button>
            ))}
          </div>
        </div>
      </div>
      <button type="button" onClick={start} disabled={!pool.length} className="h-14 w-full rounded-full bg-accent text-lg font-bold text-white disabled:opacity-40">
        {t("practice.start")} · {t("practice.count", { n: filters.size ? Math.min(filters.size, pool.length) : pool.length })}
      </button>
      {!pool.length && <p className="text-center text-sm text-muted">{t("practice.empty")}</p>}
    </div>
  );
}
