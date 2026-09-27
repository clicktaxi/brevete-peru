"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLang, useT } from "@/components/providers";
import { QuestionCard } from "@/components/question/QuestionCard";
import { useCategoryData } from "@/components/quiz/useCategoryData";
import { Icon } from "@/components/ui/Icon";
import { Loading } from "@/components/ui/Loading";
import { pickExamQuestions, remainingSeconds, scoreAttempt, type ExamAttempt } from "@/lib/exam";
import { discardActiveAttempt, getActiveAttempt, getAttempts, recordAnswer, saveActiveAttempt, saveFinishedAttempt } from "@/lib/progress";
import { formatClock, randomSeed } from "@/lib/text";
import type { OptionKey } from "@/lib/types";

export function ExamMode({ cat }: { cat: string }) {
  const t = useT();
  const lang = useLang();
  const router = useRouter();
  const { data, glossary, error } = useCategoryData(cat);
  const [active, setActive] = useState<ExamAttempt | null | undefined>(undefined);
  const [lastResult, setLastResult] = useState<ExamAttempt | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    getActiveAttempt(cat).then((a) => setActive(a ?? null));
    getAttempts(cat).then((list) => setLastResult(list.filter((a) => a.finishedAt).at(-1) ?? null));
  }, [cat]);

  if (error || !data || !glossary || active === undefined) return <Loading error={error} />;

  const start = async () => {
    const seed = randomSeed();
    const attempt: ExamAttempt = {
      id: `${Date.now().toString(36)}-${seed.toString(36)}`,
      category: cat,
      seed,
      questionIds: pickExamQuestions(data.questions, data.category.examQuestions, seed).map((q) => q.id),
      answers: {},
      startedAt: Date.now(),
      timeLimitSec: data.category.timeLimitSec,
    };
    await saveActiveAttempt(cat, attempt);
    setActive(attempt);
    setRunning(true);
    track("exam_start");
  };

  if (running && active) {
    return (
      <ExamRunner
        attempt={active}
        data={data}
        logic={glossary.logic}
        onFinish={async (a) => {
          const byId = new Map(data.questions.map((q) => [q.id, q]));
          const res = scoreAttempt(a, byId, data.category.passScore);
          const finished: ExamAttempt = { ...a, finishedAt: Date.now(), score: res.score, passed: res.passed };
          for (const id of a.questionIds) {
            const q = byId.get(id)!;
            const ans = a.answers[id];
            if (ans) await recordAnswer(cat, id, ans, ans === q.correct);
          }
          await saveFinishedAttempt(cat, finished);
          track("exam_finish", { score: res.score });
          router.push(`/${lang}/${cat}/exam/result/?id=${finished.id}`);
        }}
        onLeave={() => setRunning(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted">{t("exam.intro", { n: data.category.examQuestions, min: data.category.timeLimitSec / 60, pass: data.category.passScore })}</p>
      {active ? (
        <div className="space-y-2">
          <button type="button" onClick={() => setRunning(true)} className="h-14 w-full rounded-full bg-accent text-lg font-bold text-white">
            {t("exam.resume")} ({Object.keys(active.answers).length}/{active.questionIds.length})
          </button>
          <button
            type="button"
            onClick={async () => {
              await discardActiveAttempt(cat);
              setActive(null);
            }}
            className="h-12 w-full rounded-full bg-black/5 font-semibold"
          >
            {t("exam.discard")}
          </button>
        </div>
      ) : (
        <button type="button" onClick={start} className="h-14 w-full rounded-full bg-accent text-lg font-bold text-white">
          {t("exam.start")}
        </button>
      )}
      {lastResult && (
        <Link href={`/${lang}/${cat}/exam/result/?id=${lastResult.id}`} className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm">
          <Icon name="trophy" className={`h-6 w-6 ${lastResult.passed ? "text-correct" : "text-wrong"}`} />
          <span className="flex-1">
            <span className="block text-sm text-muted">{t("exam.last")}</span>
            <span className="block font-semibold">
              {lastResult.passed ? t("exam.passed") : t("exam.failed")} · {t("exam.score", { score: lastResult.score ?? 0, total: lastResult.questionIds.length })}
            </span>
          </span>
          <Icon name="chevron" className="h-5 w-5 text-muted" />
        </Link>
      )}
      <Link href={`/${lang}/history/`} className="block text-center text-sm font-medium text-accent">
        {t("exam.toHistory")}
      </Link>
    </div>
  );
}

function ExamRunner({ attempt: initial, data, logic, onFinish, onLeave }: { attempt: ExamAttempt; data: NonNullable<ReturnType<typeof useCategoryData>["data"]>; logic: NonNullable<ReturnType<typeof useCategoryData>["glossary"]>["logic"]; onFinish: (a: ExamAttempt) => void; onLeave: () => void }) {
  const t = useT();
  const [attempt, setAttempt] = useState(initial);
  const [index, setIndex] = useState(() => Math.min(Object.keys(initial.answers).length, initial.questionIds.length - 1));
  const [grid, setGrid] = useState(false);
  const [left, setLeft] = useState(() => remainingSeconds(initial));
  const finishing = useRef(false);
  const byId = useMemo(() => new Map(data.questions.map((q) => [q.id, q])), [data]);
  const q = byId.get(attempt.questionIds[index])!;
  const answered = Object.keys(attempt.answers).length;

  const finish = useCallback(() => {
    if (finishing.current) return;
    finishing.current = true;
    onFinish(attempt);
  }, [attempt, onFinish]);

  useEffect(() => {
    const id = setInterval(() => {
      const r = remainingSeconds(attempt);
      setLeft(r);
      if (r <= 0) {
        alert(t("exam.timeUp"));
        finish();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [attempt, finish, t]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const select = (key: OptionKey) => {
    const next = { ...attempt, answers: { ...attempt.answers, [q.id]: key } };
    setAttempt(next);
    void saveActiveAttempt(attempt.category, next);
  };

  const askFinish = () => {
    const missing = attempt.questionIds.length - answered;
    if (confirm(t("exam.finishConfirm", { n: missing }))) finish();
  };

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-bg">
      <div className="mx-auto max-w-2xl space-y-3 px-4 pb-8">
      <div className="sticky top-0 z-10 -mx-4 flex items-center gap-2 bg-bg px-4 py-2 text-sm">
        <button type="button" onClick={() => confirm(t("exam.leaveConfirm")) && onLeave()} className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5" aria-label={t("common.back")}>
          <Icon name="x" className="h-5 w-5" />
        </button>
        <span className="flex-1 font-medium">Pregunta {index + 1} de {attempt.questionIds.length}</span>
        <span className={`tabular rounded-full px-3 py-1 font-bold ${left < 300 ? "bg-wrong-soft text-wrong" : "bg-black/5"}`}>
          Tiempo restante {formatClock(left)}
        </span>
      </div>

      <QuestionCard question={q} logic={logic} helpLevel={4} mode="exam" selected={attempt.answers[q.id]} onSelect={select} hideNumber />

      <div className="grid grid-cols-3 gap-2">
        <button type="button" disabled={index === 0} onClick={() => setIndex(index - 1)} className="h-12 rounded-full bg-black/5 font-semibold disabled:opacity-40">
          Anterior
        </button>
        <button type="button" onClick={() => setGrid((g) => !g)} className="h-12 rounded-full bg-black/5 font-semibold" aria-expanded={grid}>
          {answered}/{attempt.questionIds.length}
        </button>
        {index + 1 < attempt.questionIds.length ? (
          <button type="button" onClick={() => setIndex(index + 1)} className="h-12 rounded-full bg-accent font-semibold text-white">
            Siguiente
          </button>
        ) : (
          <button type="button" onClick={askFinish} className="h-12 rounded-full bg-correct font-semibold text-white">
            Finalizar
          </button>
        )}
      </div>

      {grid && (
        <div className="rounded-2xl bg-surface p-3 shadow-sm">
          <ol className="grid grid-cols-8 gap-1.5">
            {attempt.questionIds.map((id, i) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => {
                    setIndex(i);
                    setGrid(false);
                  }}
                  className={`h-9 w-full rounded-lg text-sm font-semibold ${i === index ? "ring-2 ring-accent" : ""} ${attempt.answers[id] ? "bg-accent-soft text-accent" : "bg-black/5"}`}
                  aria-current={i === index ? "true" : undefined}
                >
                  {i + 1}
                </button>
              </li>
            ))}
          </ol>
          <button type="button" onClick={askFinish} className="mt-3 h-12 w-full rounded-full bg-correct font-semibold text-white">
            Finalizar
          </button>
        </div>
      )}
      </div>
    </div>
  );
}

function track(event: string, props?: Record<string, string | number>) {
  const w = window as unknown as { plausible?: (e: string, o?: { props?: Record<string, string | number> }) => void };
  w.plausible?.(event, props ? { props } : undefined);
}
