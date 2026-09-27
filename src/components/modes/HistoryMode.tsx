"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang, useT } from "@/components/providers";
import { Loading } from "@/components/ui/Loading";
import type { ExamAttempt } from "@/lib/exam";
import { getAttempts } from "@/lib/progress";
import { formatClock } from "@/lib/text";

export function HistoryMode({ cats }: { cats: string[] }) {
  const t = useT();
  const lang = useLang();
  const [list, setList] = useState<ExamAttempt[] | null>(null);

  useEffect(() => {
    Promise.all(cats.map(getAttempts)).then((all) => setList(all.flat().filter((a) => a.finishedAt).sort((a, b) => b.finishedAt! - a.finishedAt!)));
  }, [cats]);

  if (!list) return <Loading />;
  if (!list.length) return <p className="rounded-2xl bg-surface p-4 text-muted">{t("history.empty")}</p>;

  let streak = 0;
  for (const a of list) {
    if (a.passed) streak++;
    else break;
  }
  const best = Math.max(...list.map((a) => a.score ?? 0));

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        {t("history.streak", { n: streak })} · {t("history.best", { score: best })}
      </p>
      <ul className="space-y-2">
        {list.map((a) => (
          <li key={a.id}>
            <Link href={`/${lang}/${a.category}/exam/result/?id=${a.id}`} className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-sm">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white ${a.passed ? "bg-correct" : "bg-wrong"}`}>{a.score}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{a.passed ? t("exam.passed") : t("exam.failed")}</span>
                <span className="block text-xs text-muted">
                  {new Date(a.finishedAt!).toLocaleString(lang)} · {formatClock(Math.floor((a.finishedAt! - a.startedAt) / 1000))} · {a.category.toUpperCase()}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
