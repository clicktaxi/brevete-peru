"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang, useT } from "@/components/providers";
import { Icon } from "@/components/ui/Icon";
import { loadCategoryData } from "@/lib/data";
import { dailyPortion, getAttempts, getQuestionStats, getTopicProgress, isLearned, isMistake, nextStep, type StepId } from "@/lib/progress";
import { topicTermCount } from "@/lib/topic";

interface Summary {
  total: number;
  learned: number;
  mistakes: number;
  due: number;
  passed: number;
  attempts: number;
  next: { href: string; topic: string; step: StepId } | null;
  started: boolean;
}

export function HomeDashboard({ cat, code }: { cat: string; code: string }) {
  const lang = useLang();
  const t = useT();
  const [s, setS] = useState<Summary | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [data, stats, tp, attempts] = await Promise.all([loadCategoryData(cat, lang), getQuestionStats(cat), getTopicProgress(cat), getAttempts(cat)]);
      const ids = data.questions.map((q) => q.id);
      const topics = data.topics.filter((tt) => data.questions.some((q) => q.topic === tt.id));
      let next: Summary["next"] = null;
      for (const topic of topics) {
        const step = nextStep(tp[topic.id], topicTermCount(data.questions, topic.id));
        if (step) {
          next = { href: `/${lang}/${cat}/topic/${topic.id}/${step}/`, topic: topic.title[lang], step };
          break;
        }
      }
      const finished = attempts.filter((a) => a.finishedAt).slice(-5);
      if (alive)
        setS({
          total: ids.length,
          learned: ids.filter((id) => isLearned(stats[id])).length,
          mistakes: ids.filter((id) => isMistake(stats[id])).length,
          due: dailyPortion(ids, stats, 20).length,
          passed: finished.filter((a) => a.passed).length,
          attempts: finished.length,
          next,
          started: Object.keys(stats).length > 0 || Object.keys(tp).length > 0,
        });
    })().catch(() => {});
    return () => {
      alive = false;
    };
  }, [cat, lang]);

  const learnedPct = s ? Math.round((s.learned / s.total) * 100) : 0;
  const examPct = s?.attempts ? Math.round((s.passed / s.attempts) * 100) : 0;
  const readiness = s ? (s.attempts ? Math.round((learnedPct + examPct) / 2) : learnedPct) : 0;
  const base = `/${lang}/${cat}`;

  return (
    <div className="space-y-4">
      <section className="hero rounded-3xl p-5 text-white shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm opacity-80">{t("home.progressTitle", { code })}</p>
            <p className="mt-1 text-4xl font-black tabular">{readiness}%</p>
            <p className="text-sm opacity-80">{t("hub.readiness")}</p>
          </div>
          <Link href={`${base}/`} className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold">
            {t("home.details")} →
          </Link>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-white transition-all" style={{ width: `${readiness}%` }} />
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-white/10 p-2">
            <dt className="text-[11px] uppercase tracking-wide opacity-70">{t("home.statLearned")}</dt>
            <dd className="text-lg font-bold tabular">
              {s?.learned ?? 0}
              <span className="text-xs font-normal opacity-70">/{s?.total ?? 200}</span>
            </dd>
          </div>
          <div className="rounded-2xl bg-white/10 p-2">
            <dt className="text-[11px] uppercase tracking-wide opacity-70">{t("home.statMistakes")}</dt>
            <dd className="text-lg font-bold tabular">{s?.mistakes ?? 0}</dd>
          </div>
          <div className="rounded-2xl bg-white/10 p-2">
            <dt className="text-[11px] uppercase tracking-wide opacity-70">{t("home.statExams")}</dt>
            <dd className="text-lg font-bold tabular">
              {s?.passed ?? 0}
              <span className="text-xs font-normal opacity-70">/{s?.attempts ?? 0}</span>
            </dd>
          </div>
        </dl>
      </section>

      <Link href={s?.next?.href ?? `${base}/`} className="flex h-16 items-center gap-3 rounded-2xl bg-accent px-5 text-white shadow-md active:opacity-90">
        <Icon name="bolt" className="h-7 w-7 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-bold leading-tight">{s?.started ? t("home.continue") : t("home.start")}</span>
          <span className="block truncate text-sm opacity-90">{s?.next ? `${s.next.topic} · ${t(`steps.${s.next.step}`)}` : s ? t("steps.done") : t("common.loading")}</span>
        </span>
        <Icon name="chevron" className="h-5 w-5 shrink-0" />
      </Link>

      <div className="grid grid-cols-3 gap-2">
        {[
          { href: `${base}/review/`, icon: "repeat", label: t("review.title"), badge: s?.due },
          { href: `${base}/practice/`, icon: "target", label: t("nav.practice"), badge: undefined },
          { href: `${base}/exam/`, icon: "clock", label: t("nav.exam"), badge: undefined },
        ].map((a) => (
          <Link key={a.href} href={a.href} className="relative flex h-24 flex-col items-center justify-center gap-1 rounded-2xl bg-surface text-sm font-semibold shadow-sm active:bg-accent-soft">
            <Icon name={a.icon} className="h-7 w-7 text-accent" />
            {a.label}
            {a.badge ? <span className="absolute right-2 top-2 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-white">{a.badge}</span> : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
