"use client";

import { useMemo, useState } from "react";
import { useHelpLevel, useLang, useT } from "@/components/providers";
import { QuestionCard } from "@/components/question/QuestionCard";
import { useCategoryData } from "@/components/quiz/useCategoryData";
import { Icon } from "@/components/ui/Icon";
import { Loading } from "@/components/ui/Loading";
import { recordAnswer } from "@/lib/progress";
import { diffWords, randomSeed, shuffleWithSeed } from "@/lib/text";
import type { OptionKey, Question } from "@/lib/types";

function pairs(questions: Question[]): [Question, Question][] {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const seen = new Set<string>();
  const out: [Question, Question][] = [];
  for (const q of questions) {
    for (const tid of q.twins ?? []) {
      const key = [q.id, tid].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      const tw = byId.get(tid);
      if (tw) out.push([q, tw]);
    }
  }
  return out;
}

function Diff({ a, b, label }: { a: string; b: string; label: string }) {
  const d = diffWords(a, b);
  return (
    <p className="text-[15px] leading-relaxed">
      <span className="mr-1 text-xs font-semibold text-muted">{label}</span>
      {d.a.map((w, i) => (
        <span key={i} className={w.diff ? "rounded bg-logic-soft px-0.5 font-semibold text-logic" : ""}>
          {w.w}{" "}
        </span>
      ))}
    </p>
  );
}

export function TwinsMode({ cat }: { cat: string }) {
  const t = useT();
  const lang = useLang();
  const { data, glossary, error } = useCategoryData(cat);
  const [helpLevel, setHelpLevel] = useHelpLevel();
  const [seed] = useState(() => randomSeed());
  const [pairIndex, setPairIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, OptionKey>>({});
  const list = useMemo(() => (data ? shuffleWithSeed(pairs(data.questions), seed) : []), [data, seed]);

  if (error || !data || !glossary) return <Loading error={error} />;
  if (!list.length) return <p className="rounded-2xl bg-surface p-4 text-muted">{t("twins.empty")}</p>;

  const pair = list[pairIndex];
  const bothAnswered = pair.every((q) => answers[q.id]);
  const answer = (q: Question, k: OptionKey) => {
    setAnswers((a) => ({ ...a, [q.id]: k }));
    void recordAnswer(cat, q.id, k, k === q.correct, { withHelp: helpLevel < 4 });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        {t("twins.intro")} · {t("twins.pair", { index: pairIndex + 1, total: list.length })}
      </p>
      {pair.map((q, i) => (
        <QuestionCard
          key={q.id}
          question={q}
          translation={data.translations[q.id]}
          logic={glossary.logic}
          helpLevel={helpLevel}
          onHelpLevel={setHelpLevel}
          mode="quiz"
          selected={answers[q.id]}
          onSelect={(k) => answer(q, k)}
          showAnchors
          position={{ index: i + 1, total: 2 }}
        />
      ))}
      {bothAnswered && (
        <section className="rounded-2xl bg-surface p-4 shadow-sm">
          <h2 className="mb-2 font-semibold">{t("twins.compare")}</h2>
          <div className="space-y-3">
            <div>
              <Diff a={pair[0].text} b={pair[1].text} label={`${pair[0].number}`} />
              <Diff a={pair[1].text} b={pair[0].text} label={`${pair[1].number}`} />
            </div>
            <div className="border-t border-black/5 pt-3">
              <Diff a={pair[0].options[pair[0].correct]} b={pair[1].options[pair[1].correct]} label={`${pair[0].number} → ${pair[0].correct})`} />
              <Diff a={pair[1].options[pair[1].correct]} b={pair[0].options[pair[0].correct]} label={`${pair[1].number} → ${pair[1].correct})`} />
            </div>
            {lang !== "es" && (
              <div className="border-t border-black/5 pt-3 text-sm text-muted">
                <p>
                  {pair[0].number}: {data.translations[pair[0].id]?.gist}
                </p>
                <p>
                  {pair[1].number}: {data.translations[pair[1].id]?.gist}
                </p>
              </div>
            )}
          </div>
          <button type="button" onClick={() => setPairIndex((pairIndex + 1) % list.length)} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent font-semibold text-white">
            {t("twins.nextPair")} <Icon name="chevron" className="h-5 w-5" />
          </button>
        </section>
      )}
    </div>
  );
}
