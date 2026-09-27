"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang, useT } from "@/components/providers";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { useCategoryData } from "@/components/quiz/useCategoryData";
import { Icon } from "@/components/ui/Icon";
import { Loading } from "@/components/ui/Loading";
import { dailyPortion, getQuestionStats, isDue, type QuestionStats } from "@/lib/progress";

export const DAILY_LIMIT = 20;

export function ReviewMode({ cat }: { cat: string }) {
  const t = useT();
  const lang = useLang();
  const { data, glossary, error } = useCategoryData(cat);
  const [stats, setStats] = useState<Record<string, QuestionStats> | null>(null);
  const [ids, setIds] = useState<string[] | null>(null);

  useEffect(() => {
    getQuestionStats(cat).then(setStats);
  }, [cat]);

  if (error || !data || !glossary || !stats) return <Loading error={error} />;

  const allIds = data.questions.map((q) => q.id);
  const due = allIds.filter((id) => isDue(stats[id])).length;
  const fresh = allIds.filter((id) => !stats[id]?.seen).length;
  const portion = dailyPortion(allIds, stats, DAILY_LIMIT);

  if (ids) {
    const byId = new Map(data.questions.map((q) => [q.id, q]));
    return (
      <QuizRunner
        cat={cat}
        questions={ids.map((id) => byId.get(id)!)}
        translations={data.translations}
        logic={glossary.logic}
        finishedContent={() => (
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-sm text-muted">{t("review.doneHint")}</p>
            <Link href={`/${lang}/${cat}/`} className="h-12 rounded-full bg-accent leading-[3rem] font-semibold text-white">
              {t("steps.backToTopic")}
            </Link>
          </div>
        )}
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted">{t("review.intro")}</p>
      <div className="hero rounded-3xl p-5 text-white">
        <p className="text-sm opacity-80">{t("review.today")}</p>
        <p className="text-4xl font-black tabular">{portion.length}</p>
        <p className="mt-1 text-sm opacity-80">
          {t("review.due", { n: due })} · {t("review.fresh", { n: fresh })}
        </p>
      </div>
      {portion.length ? (
        <button type="button" onClick={() => setIds(portion)} className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-accent text-lg font-bold text-white">
          <Icon name="repeat" className="h-5 w-5" /> {t("review.start", { n: portion.length })}
        </button>
      ) : (
        <p className="rounded-2xl bg-surface p-4 text-center text-muted">{t("review.empty")}</p>
      )}
    </div>
  );
}
