"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang, useT } from "@/components/providers";
import { Icon } from "@/components/ui/Icon";
import { loadCategoryData } from "@/lib/data";
import { getQuestionStats, getTopicProgress, isLearned, nextStep, type StepId } from "@/lib/progress";

interface Target {
  href: string;
  topicTitle: string;
  step: StepId;
  learned: number;
  total: number;
}

export function ContinueButton({ cat }: { cat: string }) {
  const lang = useLang();
  const t = useT();
  const [target, setTarget] = useState<Target | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [data, tp, stats] = await Promise.all([loadCategoryData(cat, lang), getTopicProgress(cat), getQuestionStats(cat)]);
      const topics = data.topics.filter((tt) => data.questions.some((q) => q.topic === tt.id));
      for (const topic of topics) {
        const words = new Set(data.questions.filter((q) => q.topic === topic.id).flatMap((q) => q.terms)).size;
        const step = nextStep(tp[topic.id], Math.min(words, 20));
        if (step) {
          if (alive)
            setTarget({
              href: `/${lang}/${cat}/topic/${topic.id}/${step}/`,
              topicTitle: topic.title[lang],
              step,
              learned: data.questions.filter((q) => isLearned(stats[q.id])).length,
              total: data.questions.length,
            });
          return;
        }
      }
      if (alive) setTarget({ href: `/${lang}/${cat}/exam/`, topicTitle: "", step: "exam", learned: 0, total: 0 });
    })().catch(() => {});
    return () => {
      alive = false;
    };
  }, [cat, lang]);

  return (
    <Link href={target?.href ?? `/${lang}/${cat}/`} className="hero flex items-center gap-3 rounded-3xl p-5 text-white shadow-md active:opacity-90">
      <Icon name="bolt" className="h-7 w-7" />
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-bold">{t("home.continue")}</span>
        <span className="block truncate text-sm opacity-90">
          {target?.topicTitle ? `${target.topicTitle} · ${t(`steps.${target.step}`)}` : t("home.startHint")}
        </span>
      </span>
      <Icon name="chevron" className="h-5 w-5" />
    </Link>
  );
}
