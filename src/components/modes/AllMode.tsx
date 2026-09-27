"use client";

import Link from "next/link";
import MiniSearch from "minisearch";
import { useEffect, useMemo, useState } from "react";
import { useLang, useT } from "@/components/providers";
import { useCategoryData } from "@/components/quiz/useCategoryData";
import { Icon } from "@/components/ui/Icon";
import { Loading } from "@/components/ui/Loading";
import { getQuestionStats, isLearned, isMistake, type QuestionStats } from "@/lib/progress";
import { fold, questionSlug } from "@/lib/text";
import { OPTION_KEYS } from "@/lib/types";

export function AllMode({ cat }: { cat: string }) {
  const t = useT();
  const lang = useLang();
  const { data, error } = useCategoryData(cat);
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("");
  const [showAnswers, setShowAnswers] = useState(true);
  const [stats, setStats] = useState<Record<string, QuestionStats>>({});

  useEffect(() => {
    getQuestionStats(cat).then(setStats);
  }, [cat]);

  const index = useMemo(() => {
    if (!data) return null;
    const ms = new MiniSearch({
      fields: ["text", "options", "tr", "number"],
      storeFields: ["id"],
      processTerm: (term) => fold(term),
      searchOptions: { prefix: true, fuzzy: 0.1, processTerm: (term) => fold(term) },
    });
    ms.addAll(
      data.questions.map((q) => {
        const tr = data.translations[q.id];
        return {
          id: q.id,
          number: String(q.number),
          text: q.text,
          options: OPTION_KEYS.map((k) => q.options[k]).join(" "),
          tr: tr ? [tr.text, ...OPTION_KEYS.map((k) => tr.options[k]), tr.gist].join(" ") : "",
        };
      }),
    );
    return ms;
  }, [data]);

  if (error || !data) return <Loading error={error} />;

  let list = data.questions;
  const qn = parseInt(query.trim(), 10);
  if (query.trim() && index) {
    if (Number.isFinite(qn) && /^\d+$/.test(query.trim())) list = data.questions.filter((q) => String(q.number).startsWith(query.trim()));
    else {
      const hits = new Set(index.search(query).map((r) => r.id as string));
      list = data.questions.filter((q) => hits.has(q.id));
    }
  }
  if (topic) list = list.filter((q) => q.topic === topic);

  return (
    <div className="space-y-3">
      <div className="sticky top-14 z-10 -mx-4 space-y-2 bg-bg px-4 py-2">
        <label className="relative block">
          <Icon name="search" className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-muted" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("all.searchPlaceholder")} className="h-12 w-full rounded-xl border border-black/10 bg-surface pl-10 pr-3 text-base" />
        </label>
        <div className="flex gap-2">
          <select value={topic} onChange={(e) => setTopic(e.target.value)} className="h-11 min-w-0 flex-1 rounded-xl border border-black/10 bg-surface px-2 text-sm">
            <option value="">{t("practice.allTopics")}</option>
            {data.topics
              .filter((tp) => data.questions.some((q) => q.topic === tp.id))
              .map((tp) => (
                <option key={tp.id} value={tp.id}>
                  {tp.title[lang]}
                </option>
              ))}
          </select>
          <button type="button" onClick={() => setShowAnswers((v) => !v)} aria-pressed={showAnswers} className={`h-11 rounded-xl px-3 text-sm font-medium ${showAnswers ? "bg-accent text-white" : "bg-black/5"}`}>
            {t("all.showAnswers")}
          </button>
        </div>
      </div>
      <p className="text-xs text-muted">{t("common.results", { n: list.length })}</p>
      <ol className="space-y-2">
        {list.map((q) => {
          const s = stats[q.id];
          const tr = data.translations[q.id];
          return (
            <li key={q.id} className="rounded-2xl bg-surface p-3 shadow-sm">
              <Link href={`/${lang}/${cat}/q/${questionSlug(q.number, q.text)}/`} className="block">
                <div className="flex items-start gap-2">
                  <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${isLearned(s) ? "bg-correct" : isMistake(s) ? "bg-wrong" : s?.seen ? "bg-logic" : "bg-black/10"}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">
                      {q.number}. {q.text}
                    </span>
                    {tr && <span className="block text-sm text-muted">{tr.text}</span>}
                    {q.image && <Icon name="image" className="mt-1 h-4 w-4 text-muted" />}
                  </span>
                  {s?.starred && <Icon name="star" className="h-4 w-4 fill-current text-logic" />}
                </div>
              </Link>
              {showAnswers && (
                <p className="mt-2 rounded-lg bg-correct-soft px-2 py-1 text-sm text-correct">
                  <strong>{q.correct})</strong> {q.options[q.correct]}
                  {tr && <span className="block text-xs text-muted">{tr.options[q.correct]}</span>}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      {!list.length && <p className="text-center text-muted">{t("common.noResults")}</p>}
    </div>
  );
}
