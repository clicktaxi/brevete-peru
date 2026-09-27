"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLang, useT } from "@/components/providers";
import { Icon } from "@/components/ui/Icon";
import { getTopicProgress, recordWordSeen } from "@/lib/progress";
import { topicTerms } from "@/lib/topic";
import type { GlossaryTerm, Question } from "@/lib/types";

export function WordsStep({ cat, topic, questions, glossary }: { cat: string; topic: string; questions: Question[]; glossary: GlossaryTerm[] }) {
  const t = useT();
  const lang = useLang();
  const words = useMemo(() => topicTerms(questions, topic, glossary), [questions, topic, glossary]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const word = words[index];

  useEffect(() => {
    getTopicProgress(cat).then((all) => setSeen(new Set(all[topic]?.wordsSeen ?? [])));
  }, [cat, topic]);

  useEffect(() => {
    if (!word) return;
    recordWordSeen(cat, topic, word.id).then((tp) => setSeen(new Set(tp.wordsSeen)));
  }, [cat, topic, word]);

  if (!word) return <p className="rounded-2xl bg-surface p-4 text-muted">{t("common.empty")}</p>;

  const tr = word.tr[lang] ?? word.tr.en ?? "";
  const note = word.note?.[lang];
  const example = word.example ? questions.find((q) => q.id === word.example) : undefined;
  const allSeen = words.every((w) => seen.has(w.id));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-sm text-muted">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/5">
          <div className="h-full rounded-full bg-accent" style={{ width: `${((index + 1) / words.length) * 100}%` }} />
        </div>
        <span className="tabular">
          {index + 1}/{words.length}
        </span>
      </div>
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="flex min-h-[40vh] w-full flex-col items-center justify-center rounded-3xl bg-surface p-6 text-center shadow-sm"
        aria-pressed={flipped}
      >
        <span className="text-3xl font-bold leading-tight">{word.es}</span>
        {word.forms?.length ? <span className="mt-2 text-sm text-muted">{word.forms.join(" · ")}</span> : null}
        {flipped ? (
          <>
            <span className="mt-6 text-2xl font-semibold text-accent">{tr}</span>
            {note && <span className="mt-3 text-sm text-muted">{note}</span>}
          </>
        ) : (
          <span className="mt-6 text-sm text-muted">{t("steps.flipHint")}</span>
        )}
      </button>
      {flipped && example && lang !== "es" && (
        <p className="rounded-2xl bg-surface p-3 text-sm shadow-sm">
          <span className="text-muted">{t("glossary.example", { n: example.number })}:</span> {example.text}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => {
            setIndex(index - 1);
            setFlipped(false);
          }}
          className="flex h-12 flex-1 items-center justify-center gap-1 rounded-full bg-black/5 font-semibold disabled:opacity-40"
        >
          <Icon name="back" className="h-5 w-5" /> {t("common.prev")}
        </button>
        {index + 1 < words.length ? (
          <button
            type="button"
            onClick={() => {
              setIndex(index + 1);
              setFlipped(false);
            }}
            className="flex h-12 flex-1 items-center justify-center gap-1 rounded-full bg-accent font-semibold text-white"
          >
            {t("common.next")} <Icon name="chevron" className="h-5 w-5" />
          </button>
        ) : (
          <Link href={`/${lang}/${cat}/topic/${topic}/understand/`} className="flex h-12 flex-1 items-center justify-center gap-1 rounded-full bg-correct font-semibold text-white">
            {t("steps.goNext")} <Icon name="chevron" className="h-5 w-5" />
          </Link>
        )}
      </div>
      {allSeen && <p className="text-center text-sm text-correct">{t("steps.wordsDone")}</p>}
    </div>
  );
}
