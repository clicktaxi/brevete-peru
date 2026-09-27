"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useHelpLevel, useLang, useT } from "@/components/providers";
import { QuestionCard } from "@/components/question/QuestionCard";
import { useCategoryData } from "@/components/quiz/useCategoryData";
import { Icon } from "@/components/ui/Icon";
import { Loading } from "@/components/ui/Loading";
import { scoreAttempt, type ExamAttempt } from "@/lib/exam";
import { getAttempt } from "@/lib/progress";
import { formatClock } from "@/lib/text";

export const OFFICIAL_SIMULATOR = "https://sierdgtt.mtc.gob.pe/";

export function ExamResult({ cat }: { cat: string }) {
  const t = useT();
  const lang = useLang();
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const { data, glossary, error } = useCategoryData(cat);
  const [attempt, setAttempt] = useState<ExamAttempt | null | undefined>(undefined);
  const [helpLevel, setHelpLevel] = useHelpLevel();
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    getAttempt(cat, id).then((a) => setAttempt(a ?? null));
  }, [cat, id]);

  const byId = useMemo(() => new Map((data?.questions ?? []).map((q) => [q.id, q])), [data]);
  if (error || !data || !glossary || attempt === undefined) return <Loading error={error} />;
  if (!attempt) return <p className="rounded-2xl bg-surface p-4 text-muted">{t("exam.notFound")}</p>;

  const res = scoreAttempt(attempt, byId, data.category.passScore);
  const duration = attempt.finishedAt ? Math.floor((attempt.finishedAt - attempt.startedAt) / 1000) : 0;
  const topics = data.topics.filter((tp) => res.byTopic[tp.id]);

  return (
    <div className="space-y-4">
      <div className={`rounded-3xl p-6 text-center text-white ${res.passed ? "hero" : "bg-wrong"}`}>
        <p className="text-3xl font-black tracking-wide">{res.passed ? t("exam.passed") : t("exam.failed")}</p>
        <p className="text-lg opacity-90">{res.passed ? t("exam.passedRu") : t("exam.failedRu")}</p>
        <p className="mt-3 text-5xl font-black tabular">{res.score}</p>
        <p className="opacity-90">{t("exam.score", { score: res.score, total: attempt.questionIds.length })}</p>
        <p className="mt-2 text-sm opacity-80">{t("exam.time", { time: formatClock(duration) })}</p>
      </div>

      <section className="rounded-2xl bg-surface p-4 shadow-sm">
        <h2 className="mb-2 font-semibold">{t("exam.byTopic")}</h2>
        <ul className="space-y-2 text-sm">
          {topics.map((tp) => {
            const s = res.byTopic[tp.id];
            const pct = Math.round((s.correct / s.total) * 100);
            return (
              <li key={tp.id}>
                <div className="flex justify-between">
                  <span>{tp.title[lang]}</span>
                  <span className="tabular text-muted">
                    {s.correct}/{s.total}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/5">
                  <div className={`h-full rounded-full ${pct >= 80 ? "bg-correct" : pct >= 50 ? "bg-logic" : "bg-wrong"}`} style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl bg-surface p-4 shadow-sm">
        <h2 className="mb-2 font-semibold">
          {t("exam.wrongList")} ({res.wrong.length})
        </h2>
        {res.wrong.length === 0 ? (
          <p className="text-sm text-muted">{t("exam.noWrong")}</p>
        ) : (
          <>
            <ul className="space-y-1 text-sm">
              {res.wrong.map((qid) => {
                const q = byId.get(qid)!;
                return (
                  <li key={qid} className="flex gap-2">
                    <span className="text-wrong">✗</span>
                    <span>
                      {q.number}. {data.translations[qid]?.gist ?? q.text}
                    </span>
                  </li>
                );
              })}
            </ul>
            <button type="button" onClick={() => setReviewing((v) => !v)} className="mt-3 h-12 w-full rounded-full bg-accent font-semibold text-white">
              {t("exam.review")}
            </button>
          </>
        )}
      </section>

      {reviewing &&
        res.wrong.map((qid) => (
          <QuestionCard key={qid} question={byId.get(qid)!} translation={data.translations[qid]} logic={glossary.logic} helpLevel={helpLevel} onHelpLevel={setHelpLevel} mode="quiz" selected={attempt.answers[qid] ?? byId.get(qid)!.correct} showAnchors />
        ))}

      <div className="flex flex-col gap-2">
        <Link href={`/${lang}/${cat}/exam/`} className="h-12 rounded-full bg-accent text-center leading-[3rem] font-semibold text-white">
          {t("exam.again")}
        </Link>
        <Link href={`/${lang}/history/`} className="h-12 rounded-full bg-black/5 text-center leading-[3rem] font-semibold">
          {t("exam.toHistory")}
        </Link>
      </div>
      <p className="rounded-2xl bg-accent-soft p-3 text-sm">
        {t("exam.officialHint")}{" "}
        <a href={OFFICIAL_SIMULATOR} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-accent underline">
          sierdgtt.mtc.gob.pe <Icon name="share" className="h-4 w-4" />
        </a>
      </p>
    </div>
  );
}
