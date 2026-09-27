"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang, useT } from "@/components/providers";
import { Icon } from "@/components/ui/Icon";
import { dailyPortion, getAttempts, getQuestionStats, getTopicProgress, isLearned, isMistake, nextStep, type QuestionStats, type TopicProgress } from "@/lib/progress";

interface TopicInfo {
  id: string;
  title: string;
  count: number;
  ids: string[];
}

export function CategoryProgress({ cat, topics }: { cat: string; topics: TopicInfo[] }) {
  const lang = useLang();
  const t = useT();
  const [stats, setStats] = useState<Record<string, QuestionStats>>({});
  const [tp, setTp] = useState<Record<string, TopicProgress>>({});
  const [passRate, setPassRate] = useState<{ passed: number; total: number } | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([getQuestionStats(cat), getTopicProgress(cat), getAttempts(cat)]).then(([s, p, attempts]) => {
      if (!alive) return;
      setStats(s);
      setTp(p);
      const last = attempts.filter((a) => a.finishedAt).slice(-5);
      setPassRate({ passed: last.filter((a) => a.passed).length, total: last.length });
    });
    return () => {
      alive = false;
    };
  }, [cat]);

  const total = topics.reduce((n, tt) => n + tt.count, 0);
  const learned = topics.reduce((n, tt) => n + tt.ids.filter((id) => isLearned(stats[id])).length, 0);
  const mistakes = topics.reduce((n, tt) => n + tt.ids.filter((id) => isMistake(stats[id])).length, 0);
  const learnedPct = total ? Math.round((learned / total) * 100) : 0;
  const examPct = passRate?.total ? Math.round((passRate.passed / passRate.total) * 100) : 0;
  const readiness = passRate?.total ? Math.round((learnedPct + examPct) / 2) : learnedPct;

  return (
    <section className="mt-4">
      <div className="hero rounded-3xl p-5 text-white shadow-md">
        <div className="flex items-center justify-between">
          <span className="font-semibold opacity-90">{t("hub.readiness")}</span>
          <span className="text-3xl font-black tabular">{readiness}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-white transition-all" style={{ width: `${readiness}%` }} />
        </div>
        <p className="mt-2 text-xs opacity-80">
          {t("hub.learned", { learned, total })} · {t("hub.mistakes", { n: mistakes })}
          {passRate?.total ? ` · ${t("hub.examsPassed", { passed: passRate.passed, total: passRate.total })}` : ""}
        </p>
        <Link href={`/${lang}/${cat}/review/`} className="mt-3 flex items-center justify-between rounded-2xl bg-white/10 px-3 py-2 text-sm">
          <span>{t("review.today")}</span>
          <span className="font-bold tabular">{dailyPortion(topics.flatMap((tt) => tt.ids), stats, 20).length} →</span>
        </Link>
      </div>

      <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-muted">{t("hub.topics")}</h2>
      <ul className="space-y-2">
        {topics.map((tt) => {
          const done = tt.ids.filter((id) => isLearned(stats[id])).length;
          const pct = tt.count ? Math.round((done / tt.count) * 100) : 0;
          const step = nextStep(tp[tt.id], 1);
          return (
            <li key={tt.id}>
              <Link href={`/${lang}/${cat}/topic/${tt.id}/`} className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-sm active:bg-accent-soft">
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{tt.title}</span>
                  <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-black/5">
                    <span className="block h-full rounded-full bg-correct" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="mt-1 block text-xs text-muted">
                    {done}/{tt.count} · {step ? t(`steps.${step}`) : t("steps.done")}
                  </span>
                </span>
                <Icon name="chevron" className="h-5 w-5 text-muted" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
