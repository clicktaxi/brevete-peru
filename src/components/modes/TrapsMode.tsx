"use client";

import { useEffect, useMemo, useState } from "react";
import { useLang, useT } from "@/components/providers";
import { Icon } from "@/components/ui/Icon";
import { Loading } from "@/components/ui/Loading";
import { loadGlossary } from "@/lib/data";
import { randomSeed, shuffleWithSeed } from "@/lib/text";
import type { LogicWord } from "@/lib/types";

const ROUND = 30;

export function TrapsMode() {
  const t = useT();
  const lang = useLang();
  const [words, setWords] = useState<LogicWord[] | null>(null);
  const [seed, setSeed] = useState(() => randomSeed());
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);

  useEffect(() => {
    loadGlossary().then((g) => setWords(g.logic.filter((w) => w.tr[lang] || w.tr.en)));
  }, [lang]);

  const round = useMemo(() => (words ? shuffleWithSeed(words, seed).slice(0, ROUND) : []), [words, seed]);
  const trOf = (w: LogicWord) => w.tr[lang] ?? w.tr.en ?? w.es;
  const word = round[index];
  const options = useMemo(() => {
    if (!word || !words) return [];
    const others = shuffleWithSeed(
      words.filter((w) => w.es !== word.es && trOf(w) !== trOf(word)),
      seed + index,
    ).slice(0, 3);
    return shuffleWithSeed([word, ...others], seed * 3 + index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word, words, seed, index]);

  if (!words) return <Loading />;

  if (index >= round.length) {
    return (
      <div className="rounded-2xl bg-surface p-5 text-center shadow-sm">
        <Icon name="trophy" className="mx-auto h-10 w-10 text-accent" />
        <p className="mt-2 text-lg font-semibold">{t("traps.done", { correct, total: round.length })}</p>
        <button
          type="button"
          onClick={() => {
            setSeed(randomSeed());
            setIndex(0);
            setCorrect(0);
            setPicked(null);
          }}
          className="mt-4 h-12 w-full rounded-full bg-accent font-semibold text-white"
        >
          {t("traps.again")}
        </button>
      </div>
    );
  }

  const pick = (w: LogicWord) => {
    if (picked) return;
    setPicked(w.es);
    if (w.es === word.es) setCorrect((c) => c + 1);
  };
  const opposite = word.opposite ? words.find((w) => w.es === word.opposite) : undefined;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{t("traps.intro")}</p>
      <div className="flex items-center gap-3 text-sm text-muted">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/5">
          <div className="h-full rounded-full bg-accent" style={{ width: `${(index / round.length) * 100}%` }} />
        </div>
        <span className="tabular">{t("traps.round", { index: index + 1, total: round.length })}</span>
      </div>
      <div className="rounded-3xl bg-surface p-6 text-center shadow-sm">
        <p className="text-sm text-muted">{t("traps.pick", { word: word.es })}</p>
        <p className="mt-2 text-4xl font-black text-logic">{word.es}</p>
      </div>
      <ul className="space-y-2">
        {options.map((w) => {
          let tone = "bg-surface";
          if (picked) {
            if (w.es === word.es) tone = "bg-correct-soft border-correct";
            else if (w.es === picked) tone = "bg-wrong-soft border-wrong";
            else tone = "bg-surface opacity-60";
          }
          return (
            <li key={w.es}>
              <button type="button" disabled={!!picked} onClick={() => pick(w)} className={`min-h-12 w-full rounded-xl border-2 border-transparent px-4 py-3 text-left text-lg font-medium shadow-sm ${tone}`}>
                {trOf(w)}
              </button>
            </li>
          );
        })}
      </ul>
      {picked && (
        <div className="space-y-2">
          {word.note?.[lang] && <p className="rounded-xl bg-logic-soft p-3 text-sm">{word.note[lang]}</p>}
          {opposite && (
            <p className="text-sm text-muted">
              {t("traps.opposite", { word: `${opposite.es} — ${trOf(opposite)}` })}
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              setIndex(index + 1);
              setPicked(null);
            }}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent font-semibold text-white"
          >
            {t("common.next")} <Icon name="chevron" className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
