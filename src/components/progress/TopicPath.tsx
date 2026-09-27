"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang, useT } from "@/components/providers";
import { Icon } from "@/components/ui/Icon";
import { getTopicProgress, nextStep, STEP_IDS, STEP_THRESHOLD, stepAccuracy, stepDone, type TopicProgress } from "@/lib/progress";

export function TopicPath({ cat, topic, wordsTotal }: { cat: string; topic: string; wordsTotal: number; questionIds: string[] }) {
  const lang = useLang();
  const t = useT();
  const [tp, setTp] = useState<TopicProgress | undefined>();
  useEffect(() => {
    getTopicProgress(cat).then((all) => setTp(all[topic]));
  }, [cat, topic]);
  const current = nextStep(tp, wordsTotal);

  return (
    <ol className="mt-4 space-y-2">
      {STEP_IDS.map((step, i) => {
        const done = stepDone(tp, step, wordsTotal);
        const active = current === step;
        let detail: string;
        if (step === "words") detail = t("steps.cardsSeen", { seen: Math.min(tp?.wordsSeen.length ?? 0, wordsTotal), total: wordsTotal });
        else {
          const { rate, count } = stepAccuracy(tp, step);
          detail = count ? t("steps.progress", { correct: Math.round(rate * count), count }) : t("steps.threshold", { pct: STEP_THRESHOLD[step] * 100, n: 20 });
        }
        return (
          <li key={step}>
            <Link
              href={`/${lang}/${cat}/topic/${topic}/${step}/`}
              className={`flex items-center gap-3 rounded-2xl p-4 shadow-sm ${active ? "bg-accent text-white" : "bg-surface"} ${done && !active ? "opacity-80" : ""}`}
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold ${done ? "bg-correct text-white" : active ? "bg-white/20" : "bg-black/5"}`}>
                {done ? <Icon name="check" className="h-5 w-5" /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{t(`steps.${step}`)}</span>
                <span className={`block text-xs ${active ? "text-white/80" : "text-muted"}`}>{t(`steps.${step}Desc`)}</span>
                <span className={`block text-xs ${active ? "text-white/80" : "text-muted"}`}>{detail}</span>
              </span>
              <Icon name="chevron" className="h-5 w-5 opacity-70" />
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
