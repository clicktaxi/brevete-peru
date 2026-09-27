"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useHelpLevel, useLang, useSettings, useT } from "@/components/providers";
import { QuestionCard } from "@/components/question/QuestionCard";
import { Icon } from "@/components/ui/Icon";
import type { HelpLevel, StepId } from "@/lib/progress";
import { getQuestionStats, recordAnswer, recordStepAnswer, toggleStar } from "@/lib/progress";
import type { LogicWord, OptionKey, Question, QuestionTranslation } from "@/lib/types";

export interface QuizRunnerProps {
  cat: string;
  questions: Question[];
  translations: Record<string, QuestionTranslation>;
  logic: LogicWord[];
  /** fixed help level for a topic step; undefined = user setting */
  forcedLevel?: HelpLevel;
  /** topic step to record accuracy for */
  step?: { topic: string; id: StepId };
  /** exam step: help button, answers with help don't count */
  helpButton?: boolean;
  showAnchors?: boolean;
  onFinished?: (result: { correct: number; total: number }) => void;
  finishedContent?: (result: { correct: number; total: number; restart: () => void }) => React.ReactNode;
  /** render extra per-question content after the answer (twins compare etc.) */
  after?: (q: Question, selected: OptionKey) => React.ReactNode;
}

export function QuizRunner(props: QuizRunnerProps) {
  const { cat, questions, translations, logic, forcedLevel, step, helpButton, showAnchors, onFinished, finishedContent, after } = props;
  const t = useT();
  const lang = useLang();
  const { settings } = useSettings();
  const [userLevel, setUserLevel] = useHelpLevel();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, OptionKey>>({});
  const [helpUsed, setHelpUsed] = useState<Record<string, boolean>>({});
  const [starred, setStarred] = useState<Record<string, boolean>>({});
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    getQuestionStats(cat).then((s) => {
      const map: Record<string, boolean> = {};
      for (const [id, st] of Object.entries(s)) if (st.starred) map[id] = true;
      setStarred(map);
    });
  }, [cat]);

  const q = questions[index];
  const selected = q ? answers[q.id] : undefined;
  const correctCount = useMemo(() => questions.filter((x) => answers[x.id] === x.correct).length, [answers, questions]);

  const select = useCallback(
    (key: OptionKey) => {
      if (!q || answers[q.id]) return;
      const ok = key === q.correct;
      const withHelp = helpButton ? !!helpUsed[q.id] : (forcedLevel ?? userLevel) < 4;
      setAnswers((a) => ({ ...a, [q.id]: key }));
      void recordAnswer(cat, q.id, key, ok, { withHelp });
      if (step) void recordStepAnswer(cat, step.topic, step.id, ok && !withHelp);
    },
    [q, answers, helpButton, helpUsed, forcedLevel, userLevel, cat, step],
  );

  const next = () => {
    if (index + 1 < questions.length) setIndex(index + 1);
    else {
      setFinished(true);
      onFinished?.({ correct: correctCount, total: questions.length });
    }
  };

  const restart = () => {
    setIndex(0);
    setAnswers({});
    setHelpUsed({});
    setFinished(false);
  };

  if (!questions.length) return <p className="rounded-2xl bg-surface p-4 text-muted">{t("practice.empty")}</p>;

  if (finished) {
    return (
      <div className="rounded-2xl bg-surface p-5 text-center shadow-sm">
        <Icon name="trophy" className="mx-auto h-10 w-10 text-accent" />
        <h2 className="mt-2 text-xl font-bold">{t("practice.done")}</h2>
        <p className="mt-1 text-lg">{t("practice.score", { correct: correctCount, total: questions.length })}</p>
        {finishedContent ? (
          finishedContent({ correct: correctCount, total: questions.length, restart })
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            <button type="button" onClick={restart} className="h-12 rounded-full bg-accent font-semibold text-white">
              {t("practice.again")}
            </button>
            <Link href={`/${lang}/${cat}/mistakes/`} className="h-12 rounded-full bg-black/5 leading-[3rem] font-semibold">
              {t("practice.toMistakes")}
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-sm text-muted">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/5">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${((index + (selected ? 1 : 0)) / questions.length) * 100}%` }} />
        </div>
        <span className="tabular">
          {index + 1}/{questions.length}
        </span>
        <span className="tabular text-correct">✓{correctCount}</span>
      </div>
      <QuestionCard
        key={q.id}
        question={q}
        translation={translations[q.id]}
        logic={logic}
        helpLevel={forcedLevel ?? userLevel}
        onHelpLevel={forcedLevel ? undefined : setUserLevel}
        mode="quiz"
        selected={selected}
        onSelect={select}
        shuffle={settings.shuffleOptions}
        showAnchors={showAnchors || !!selected}
        starred={!!starred[q.id]}
        onStar={() => toggleStar(cat, q.id).then((v) => setStarred((s) => ({ ...s, [q.id]: v })))}
        helpButton={helpButton ? { used: !!helpUsed[q.id], onUse: () => setHelpUsed((h) => ({ ...h, [q.id]: true })) } : undefined}
      />
      {selected && after?.(q, selected)}
      {selected && (
        <button type="button" onClick={next} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent font-semibold text-white">
          {index + 1 < questions.length ? t("common.next") : t("common.finish")}
          <Icon name="chevron" className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
