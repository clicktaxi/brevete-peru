"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLang, useT } from "@/components/providers";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { useCategoryData } from "@/components/quiz/useCategoryData";
import { Loading } from "@/components/ui/Loading";
import { WordsStep } from "./WordsStep";
import { STEP_IDS, STEP_THRESHOLD, type HelpLevel, type StepId } from "@/lib/progress";
import { randomSeed, shuffleWithSeed } from "@/lib/text";

const LEVEL: Record<Exclude<StepId, "words">, HelpLevel> = { understand: 1, recognize: 2, exam: 4 };

export function TopicStep({ cat, topic, step }: { cat: string; topic: string; step: StepId }) {
  const t = useT();
  const lang = useLang();
  const { data, glossary, error } = useCategoryData(cat);
  const [seed, setSeed] = useState(() => randomSeed());
  const questions = useMemo(() => (data ? shuffleWithSeed(data.questions.filter((q) => q.topic === topic), seed) : []), [data, topic, seed]);

  if (error || !data || !glossary) return <Loading error={error} />;

  if (step === "words") return <WordsStep cat={cat} topic={topic} questions={data.questions} glossary={glossary.terms} />;

  const nextId = STEP_IDS[STEP_IDS.indexOf(step) + 1];
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        {t(`steps.${step}Desc`)} · {t("steps.threshold", { pct: STEP_THRESHOLD[step] * 100, n: 20 })}
      </p>
      <QuizRunner
        key={seed}
        cat={cat}
        questions={questions}
        translations={data.translations}
        logic={glossary.logic}
        forcedLevel={LEVEL[step]}
        step={{ topic, id: step }}
        showAnchors={step === "recognize"}
        helpButton={step === "exam"}
        finishedContent={({ correct, total }) => {
          const ok = correct / total >= STEP_THRESHOLD[step];
          return (
            <div className="mt-4 flex flex-col gap-2">
              <p className="text-sm text-muted">{ok ? t("steps.stepDone") : t("steps.keepGoing")}</p>
              {ok && nextId && (
                <Link href={`/${lang}/${cat}/topic/${topic}/${nextId}/`} className="h-12 rounded-full bg-accent leading-[3rem] font-semibold text-white">
                  {t("steps.goNext")}: {t(`steps.${nextId}`)}
                </Link>
              )}
              <button type="button" onClick={() => setSeed(randomSeed())} className={`h-12 rounded-full font-semibold ${ok && nextId ? "bg-black/5" : "bg-accent text-white"}`}>
                {t("practice.again")}
              </button>
              <Link href={`/${lang}/${cat}/topic/${topic}/`} className="h-12 rounded-full bg-black/5 leading-[3rem] font-semibold">
                {t("steps.backToTopic")}
              </Link>
            </div>
          );
        }}
      />
    </div>
  );
}
