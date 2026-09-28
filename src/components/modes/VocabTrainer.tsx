"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLang, useT } from "@/components/providers";
import { Icon } from "@/components/ui/Icon";
import { Loading } from "@/components/ui/Loading";
import { loadGlossary } from "@/lib/data";
import { getVocabStats, recordVocab } from "@/lib/progress";
import { randomSeed } from "@/lib/text";
import {
  buildPool,
  canAssemble,
  choiceOptions,
  exerciseFor,
  isCorrectTyping,
  letterTiles,
  pickSession,
  SESSION_SIZE,
  VOCAB_LEARNED_REPS,
  VOCAB_MODES,
  wordShape,
  type ExerciseType,
  type VocabMode,
  type VocabWord,
  type VocabWordStats,
} from "@/lib/vocab";

const MODE_ICON: Record<VocabMode, string> = { mix: "shuffle", choice: "list", reverse: "repeat", letters: "grid", typing: "book" };

export function VocabTrainer() {
  const t = useT();
  const lang = useLang();
  const [pool, setPool] = useState<VocabWord[] | null>(null);
  const [stats, setStats] = useState<Record<string, VocabWordStats>>({});
  const [mode, setMode] = useState<VocabMode | null>(null);
  const [seed, setSeed] = useState(() => randomSeed());

  useEffect(() => {
    Promise.all([loadGlossary(), getVocabStats()]).then(([g, s]) => {
      setPool(buildPool(g.terms, g.logic, lang));
      setStats(s);
    });
  }, [lang]);

  if (!pool) return <Loading />;

  const now = Date.now();
  const learned = pool.filter((w) => (stats[w.id]?.reps ?? 0) >= VOCAB_LEARNED_REPS).length;
  const due = pool.filter((w) => stats[w.id] && stats[w.id].due <= now).length;

  if (mode) {
    return (
      <Session
        key={seed}
        mode={mode}
        pool={pool}
        stats={stats}
        seed={seed}
        onExit={async () => {
          setStats(await getVocabStats());
          setMode(null);
          setSeed(randomSeed());
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted">{t("vocab.intro")}</p>
      <div className="hero rounded-3xl p-5 text-white">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm opacity-80">{t("vocab.learned")}</p>
            <p className="text-3xl font-black tabular">
              {learned} <span className="text-base font-semibold opacity-70">/ {pool.length}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-80">{t("vocab.due")}</p>
            <p className="text-3xl font-black tabular">{due}</p>
          </div>
        </div>
      </div>
      <ul className="space-y-2">
        {VOCAB_MODES.map((m) => (
          <li key={m}>
            <button type="button" onClick={() => setMode(m)} className="flex w-full items-center gap-3 rounded-2xl bg-surface p-4 text-left shadow-sm active:bg-accent-soft">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Icon name={MODE_ICON[m]} className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{t(`vocab.modes.${m}`)}</span>
                <span className="block text-xs text-muted">{t(`vocab.modes.${m}Desc`)}</span>
              </span>
              <Icon name="chevron" className="h-5 w-5 text-muted" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Session({ mode, pool, stats, seed, onExit }: { mode: VocabMode; pool: VocabWord[]; stats: Record<string, VocabWordStats>; seed: number; onExit: () => void }) {
  const t = useT();
  const words = useMemo(() => pickSession(mode === "letters" ? pool.filter(canAssemble) : pool, stats, SESSION_SIZE, seed), [mode, pool, stats, seed]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const word = words[index];

  if (!words.length) return <p className="rounded-2xl bg-surface p-4 text-muted">{t("common.empty")}</p>;

  if (!word && results.length === words.length) {
    const correct = results.filter(Boolean).length;
    return (
      <div className="rounded-2xl bg-surface p-5 text-center shadow-sm">
        <Icon name="trophy" className="mx-auto h-10 w-10 text-accent" />
        <p className="mt-2 text-xl font-bold">{t("vocab.done", { correct, total: words.length })}</p>
        <button type="button" onClick={onExit} className="mt-4 h-12 w-full rounded-full bg-accent font-semibold text-white">
          {t("vocab.again")}
        </button>
      </div>
    );
  }

  const type = exerciseFor(mode, word, stats[word.id], index);
  const onResult = (ok: boolean) => {
    setResults((r) => [...r, ok]);
    void recordVocab(word.id, ok);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-sm text-muted">
        <button type="button" onClick={onExit} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5" aria-label={t("common.back")}>
          <Icon name="x" className="h-4 w-4" />
        </button>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/5">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(results.length / words.length) * 100}%` }} />
        </div>
        <span className="tabular">
          {Math.min(index + 1, words.length)}/{words.length}
        </span>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t(`vocab.modes.${type}`)}</p>
      <Exercise key={`${word.id}-${index}`} type={type} word={word} pool={pool} seed={seed + index} onResult={onResult} onNext={() => setIndex(index + 1)} />
    </div>
  );
}

function Exercise({ type, word, pool, seed, onResult, onNext }: { type: ExerciseType; word: VocabWord; pool: VocabWord[]; seed: number; onResult: (ok: boolean) => void; onNext: () => void }) {
  const t = useT();
  const [done, setDone] = useState<boolean | null>(null);
  const settle = (ok: boolean) => {
    if (done !== null) return;
    setDone(ok);
    onResult(ok);
  };

  return (
    <div className="space-y-3">
      {type === "choice" && <Choice word={word} pool={pool} seed={seed} side="tr" done={done} onPick={settle} />}
      {type === "reverse" && <Choice word={word} pool={pool} seed={seed} side="es" done={done} onPick={settle} />}
      {type === "letters" && <Letters word={word} seed={seed} done={done} onCheck={settle} />}
      {type === "typing" && <Typing word={word} done={done} onCheck={settle} />}
      {done !== null && (
        <div className={`rounded-2xl p-4 ${done ? "bg-correct-soft" : "bg-wrong-soft"}`}>
          <p className={`font-semibold ${done ? "text-correct" : "text-wrong"}`}>{done ? t("vocab.correct") : t("vocab.wrong")}</p>
          <p className="mt-1 text-lg font-bold">{word.es}</p>
          <p className="text-muted">{word.tr}</p>
          {word.note && <p className="mt-1 text-sm text-muted">{word.note}</p>}
          <button type="button" onClick={onNext} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent font-semibold text-white">
            {t("common.next")} <Icon name="chevron" className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}

function Prompt({ text, hint }: { text: string; hint: string }) {
  return (
    <div className="rounded-3xl bg-surface p-6 text-center shadow-sm">
      <p className="text-sm text-muted">{hint}</p>
      <p className="mt-2 text-3xl font-black leading-tight">{text}</p>
    </div>
  );
}

function Choice({ word, pool, seed, side, done, onPick }: { word: VocabWord; pool: VocabWord[]; seed: number; side: "es" | "tr"; done: boolean | null; onPick: (ok: boolean) => void }) {
  const t = useT();
  const options = useMemo(() => choiceOptions(word, pool, seed, side), [word, pool, seed, side]);
  const [picked, setPicked] = useState<string | null>(null);
  const promptSide = side === "tr" ? "es" : "tr";
  return (
    <>
      <Prompt text={word[promptSide]} hint={side === "tr" ? t("vocab.pickTranslation") : t("vocab.pickSpanish")} />
      <ul className="space-y-2">
        {options.map((o) => {
          let tone = "bg-surface";
          if (done !== null) {
            if (o.id === word.id) tone = "bg-correct-soft border-correct";
            else if (o.id === picked) tone = "bg-wrong-soft border-wrong";
            else tone = "bg-surface opacity-60";
          }
          return (
            <li key={o.id}>
              <button
                type="button"
                disabled={done !== null}
                onClick={() => {
                  setPicked(o.id);
                  onPick(o.id === word.id);
                }}
                className={`min-h-12 w-full rounded-xl border-2 border-transparent px-4 py-3 text-left text-lg font-medium shadow-sm ${tone}`}
              >
                {o[side]}
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Letters({ word, seed, done, onCheck }: { word: VocabWord; seed: number; done: boolean | null; onCheck: (ok: boolean) => void }) {
  const t = useT();
  const tiles = useMemo(() => letterTiles(word, seed), [word, seed]);
  const shape = useMemo(() => wordShape(word), [word]);
  const [used, setUsed] = useState<number[]>([]);
  const total = tiles.length;
  const answer = used.map((id) => tiles.find((x) => x.id === id)!.ch).join("");
  const target = word.es.replace(/\s/g, "");

  useEffect(() => {
    if (done === null && used.length === total) onCheck(answer.toLowerCase() === target.toLowerCase());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [used]);

  const slots: React.ReactNode[] = [];
  let cursor = 0;
  shape.forEach((len, wi) => {
    const chars = Array.from({ length: len }, (_, i) => answer[cursor + i] ?? "");
    cursor += len;
    slots.push(
      <span key={wi} className="inline-flex gap-0.5">
        {chars.map((ch, i) => (
          <span key={i} className={`flex h-9 w-6 items-center justify-center rounded-md border-b-2 text-lg font-bold ${ch ? "border-accent" : "border-black/20"}`}>
            {ch}
          </span>
        ))}
      </span>,
    );
  });

  return (
    <>
      <Prompt text={word.tr} hint={t("vocab.assemble")} />
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 rounded-2xl bg-surface p-3 shadow-sm">{slots}</div>
      <div className="flex flex-wrap justify-center gap-2">
        {tiles.map((tile) => {
          const isUsed = used.includes(tile.id);
          return (
            <button
              key={tile.id}
              type="button"
              disabled={isUsed || done !== null}
              onClick={() => setUsed((u) => [...u, tile.id])}
              className={`h-12 w-11 rounded-xl text-xl font-bold shadow-sm ${isUsed ? "bg-black/5 text-transparent" : "bg-surface"}`}
            >
              {tile.ch}
            </button>
          );
        })}
      </div>
      {done === null && (
        <button type="button" disabled={!used.length} onClick={() => setUsed((u) => u.slice(0, -1))} className="h-11 w-full rounded-full bg-black/5 font-semibold disabled:opacity-40">
          ⌫ {t("vocab.undo")}
        </button>
      )}
    </>
  );
}

function Typing({ word, done, onCheck }: { word: VocabWord; done: boolean | null; onCheck: (ok: boolean) => void }) {
  const t = useT();
  const [value, setValue] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const check = () => value.trim() && onCheck(isCorrectTyping(value, word));
  return (
    <>
      <Prompt text={word.tr} hint={t("vocab.type")} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          check();
        }}
        className="space-y-2"
      >
        <input
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={done !== null}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          lang="es"
          placeholder={t("vocab.typePlaceholder")}
          className={`h-14 w-full rounded-2xl border-2 bg-surface px-4 text-xl ${done === null ? "border-black/10" : done ? "border-correct" : "border-wrong"}`}
        />
        {done === null && (
          <button type="submit" disabled={!value.trim()} className="h-12 w-full rounded-full bg-accent font-semibold text-white disabled:opacity-40">
            {t("vocab.check")}
          </button>
        )}
      </form>
      {done === null && <p className="text-center text-xs text-muted">{t("vocab.accentHint")}</p>}
    </>
  );
}
