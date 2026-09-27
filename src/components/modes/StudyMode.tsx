"use client";

import { useEffect, useState } from "react";
import { useHelpLevel, useT } from "@/components/providers";
import { QuestionCard } from "@/components/question/QuestionCard";
import { useCategoryData } from "@/components/quiz/useCategoryData";
import { Icon } from "@/components/ui/Icon";
import { Loading } from "@/components/ui/Loading";
import { markSeen } from "@/lib/progress";

export function StudyMode({ cat, topic }: { cat: string; topic: string }) {
  const t = useT();
  const { data, glossary, error } = useCategoryData(cat);
  const [helpLevel, setHelpLevel] = useHelpLevel();
  const [index, setIndex] = useState(0);
  const questions = data?.questions.filter((q) => q.topic === topic) ?? [];
  const q = questions[index];

  useEffect(() => {
    if (q) void markSeen(cat, q.id);
  }, [cat, q]);

  if (error || !data || !glossary) return <Loading error={error} />;
  if (!q) return <p className="rounded-2xl bg-surface p-4 text-muted">{t("common.empty")}</p>;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{t("study.hint")}</p>
      <div className="flex items-center gap-3 text-sm text-muted">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/5">
          <div className="h-full rounded-full bg-accent" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
        </div>
        <span className="tabular">
          {index + 1}/{questions.length}
        </span>
      </div>
      <QuestionCard key={q.id} question={q} translation={data.translations[q.id]} logic={glossary.logic} helpLevel={helpLevel === 4 ? 2 : helpLevel} onHelpLevel={setHelpLevel} mode="study" showAnchors />
      <div className="flex gap-2">
        <button type="button" disabled={index === 0} onClick={() => setIndex(index - 1)} className="flex h-12 flex-1 items-center justify-center gap-1 rounded-full bg-black/5 font-semibold disabled:opacity-40">
          <Icon name="back" className="h-5 w-5" /> {t("common.prev")}
        </button>
        <button type="button" disabled={index + 1 >= questions.length} onClick={() => setIndex(index + 1)} className="flex h-12 flex-1 items-center justify-center gap-1 rounded-full bg-accent font-semibold text-white disabled:opacity-40">
          {t("common.next")} <Icon name="chevron" className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
