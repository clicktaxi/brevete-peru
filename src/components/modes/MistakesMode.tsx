"use client";

import { useEffect, useState } from "react";
import { useT } from "@/components/providers";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { useCategoryData } from "@/components/quiz/useCategoryData";
import { Loading } from "@/components/ui/Loading";
import { getQuestionStats, isMistake, type QuestionStats } from "@/lib/progress";

export function MistakesMode({ cat }: { cat: string }) {
  const t = useT();
  const { data, glossary, error } = useCategoryData(cat);
  const [stats, setStats] = useState<Record<string, QuestionStats> | null>(null);
  const [ids, setIds] = useState<string[] | null>(null);

  useEffect(() => {
    getQuestionStats(cat).then(setStats);
  }, [cat]);

  if (error || !data || !glossary || !stats) return <Loading error={error} />;

  const mistakes = data.questions.filter((q) => isMistake(stats[q.id]));

  if (ids) {
    const byId = new Map(data.questions.map((q) => [q.id, q]));
    return <QuizRunner cat={cat} questions={ids.map((id) => byId.get(id)!)} translations={data.translations} logic={glossary.logic} showAnchors finishedContent={({ restart }) => (
      <button type="button" onClick={() => { restart(); setIds(null); }} className="mt-4 h-12 w-full rounded-full bg-accent font-semibold text-white">
        {t("practice.again")}
      </button>
    )} />;
  }

  if (!mistakes.length) return <p className="rounded-2xl bg-surface p-4 text-muted">{t("mistakes.empty")}</p>;

  return (
    <div className="space-y-4">
      <p className="text-muted">{t("mistakes.count", { n: mistakes.length })}</p>
      <ul className="space-y-2">
        {mistakes.map((q) => (
          <li key={q.id} className="rounded-xl bg-surface p-3 text-sm shadow-sm">
            <span className="font-semibold text-muted">{q.number}.</span> {data.translations[q.id]?.gist ?? q.text}
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => setIds(mistakes.map((q) => q.id))} className="h-14 w-full rounded-full bg-accent text-lg font-bold text-white">
        {t("mistakes.start")}
      </button>
    </div>
  );
}
