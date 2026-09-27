"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLang, useT } from "@/components/providers";
import { Icon } from "@/components/ui/Icon";
import { GlossText, type GlossMode } from "./GlossText";
import { HelpLevelSwitch } from "./HelpLevelSwitch";
import type { HelpLevel } from "@/lib/progress";
import { diffWords, questionSlug, shuffleWithSeed } from "@/lib/text";
import { OPTION_KEYS, type LogicWord, type OptionKey, type Question, type QuestionTranslation } from "@/lib/types";

export interface QuestionCardProps {
  question: Question;
  translation?: QuestionTranslation;
  logic: LogicWord[];
  helpLevel: HelpLevel;
  onHelpLevel?: (l: HelpLevel) => void;
  /** study: correct answer shown at once; quiz: user picks; exam: no feedback until finished */
  mode: "study" | "quiz" | "exam";
  selected?: OptionKey;
  onSelect?: (key: OptionKey) => void;
  shuffle?: boolean;
  /** highlight answer anchors in the correct option (study / recognize step / review) */
  showAnchors?: boolean;
  starred?: boolean;
  onStar?: () => void;
  /** number shown as "Pregunta X de N" in exam mode */
  position?: { index: number; total: number };
  /** exam step: help hidden behind a button and counts as "with help" */
  helpButton?: { used: boolean; onUse: () => void };
  hideNumber?: boolean;
}

const LETTERS: Record<OptionKey, string> = { a: "a", b: "b", c: "c", d: "d" };

export function QuestionCard(props: QuestionCardProps) {
  const { question: q, translation: tr, logic, mode, selected, onSelect, shuffle, showAnchors, starred, onStar, helpButton, hideNumber } = props;
  const t = useT();
  const lang = useLang();
  const [translateAll, setTranslateAll] = useState(false);
  const [zoom, setZoom] = useState(false);

  const native = !!tr && lang !== "es";
  const level: HelpLevel = mode === "exam" || !native || (helpButton && !helpButton.used) ? 4 : props.helpLevel;
  const revealed = mode === "study" || (mode === "quiz" && selected !== undefined);
  // one-letter conjunctions (y, o) stay in the trainer but are too noisy to highlight inline
  const logicWords = useMemo(() => logic.map((l) => l.es).filter((w) => w.length > 2), [logic]);
  const highlightLogic = level < 4;
  const glossMode: GlossMode = level === 2 || (level === 3 && translateAll) ? "inline" : level === 3 ? "tap" : "plain";

  const order = useMemo<OptionKey[]>(() => (shuffle ? shuffleWithSeed([...OPTION_KEYS], q.number * 7919) : [...OPTION_KEYS]), [shuffle, q.number]);

  const anchorKeys = q.anchors.answerKeys;
  const canAnswer = mode !== "study" && (mode === "exam" || selected === undefined);

  const logicSwap = useMemo(() => {
    if (!revealed || !selected || selected === q.correct) return null;
    const d = diffWords(q.options[q.correct], q.options[selected]);
    const onlyA = d.a.filter((w) => w.diff);
    const onlyB = d.b.filter((w) => w.diff);
    if (onlyA.length !== 1 || onlyB.length !== 1) return null;
    const norm = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
    const good = logic.find((l) => l.es === norm(onlyA[0].w));
    const bad = logic.find((l) => l.es === norm(onlyB[0].w));
    if (!good || !bad) return null;
    return { good, bad };
  }, [revealed, selected, q, logic]);

  const trOf = (w: LogicWord) => w.tr[lang] ?? w.tr.en ?? w.es;

  return (
    <article className="rounded-2xl bg-surface p-4 shadow-sm">
      <header className="mb-3 flex items-start justify-between gap-2">
        <div className="text-sm text-muted">
          {props.position
            ? mode === "exam"
              ? `Pregunta ${props.position.index} de ${props.position.total}`
              : t("question.position", { index: props.position.index, total: props.position.total })
            : !hideNumber && (
                <Link href={`/${lang}/${q.category}/q/${questionSlug(q.number, q.text)}/`} className="hover:underline">
                  {t("question.number", { n: q.number })}
                </Link>
              )}
        </div>
        <div className="flex items-center gap-1">
          {mode !== "exam" && native && props.onHelpLevel && !helpButton && <HelpLevelSwitch compact value={props.helpLevel} onChange={props.onHelpLevel} />}
          {helpButton && !helpButton.used && (
            <button type="button" onClick={helpButton.onUse} className="flex h-9 items-center gap-1 rounded-full bg-black/5 px-3 text-sm text-muted">
              <Icon name="help" className="h-4 w-4" /> {t("question.help")}
            </button>
          )}
          {onStar && (
            <button type="button" onClick={onStar} aria-pressed={starred} aria-label={t("question.star")} className={`flex h-9 w-9 items-center justify-center rounded-full ${starred ? "text-logic" : "text-muted"} hover:bg-black/5`}>
              <Icon name="star" className={starred ? "h-5 w-5 fill-current" : "h-5 w-5"} />
            </button>
          )}
        </div>
      </header>

      {q.image && (
        <button type="button" onClick={() => setZoom(true)} className="mb-3 block w-full" aria-label={t("question.zoomImage")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={q.image} alt="" className="mx-auto max-h-[40vh] w-auto max-w-full rounded-lg object-contain" loading="lazy" />
        </button>
      )}
      {zoom && q.image && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setZoom(false)} role="dialog">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={q.image} alt="" className="max-h-full max-w-full rounded-lg bg-white object-contain" />
        </div>
      )}

      <div className="mb-4">
        {level === 1 && native ? (
          <>
            <p className="text-xl font-semibold leading-snug">{tr!.text}</p>
            <p className="mt-1 text-sm text-muted">
              <GlossText text={q.text} mode="plain" logicWords={logicWords} highlightLogic />
            </p>
          </>
        ) : (
          <p className="text-lg font-semibold leading-relaxed">
            <GlossText text={q.text} chunks={tr?.gloss.text} mode={glossMode} logicWords={logicWords} highlightLogic={highlightLogic} />
          </p>
        )}
        {q.answerType !== "text" && level < 4 && (
          <p className="mt-2 inline-block rounded-md bg-logic-soft px-2 py-0.5 text-xs font-medium text-logic">{t(`question.answerType.${q.answerType}`)}</p>
        )}
      </div>

      <ol className="space-y-2">
        {order.map((k) => {
          const isCorrect = k === q.correct;
          const isSelected = selected === k;
          let tone = "border-black/10 bg-bg";
          if (revealed) {
            if (isCorrect) tone = "border-correct bg-correct-soft";
            else if (isSelected) tone = "border-wrong bg-wrong-soft";
            else tone = "border-black/5 bg-bg opacity-60";
          } else if (isSelected) tone = "border-accent bg-accent-soft";
          const chunks = tr?.gloss.options[k];
          const showAnchor = !!showAnchors && isCorrect && revealed;
          return (
            <li key={k}>
              <div
                role="button"
                tabIndex={canAnswer ? 0 : -1}
                aria-disabled={!canAnswer}
                onClick={() => canAnswer && onSelect?.(k)}
                onKeyDown={(e) => {
                  if (canAnswer && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onSelect?.(k);
                  }
                }}
                className={`flex w-full items-start gap-3 rounded-xl border-2 p-3 text-left transition ${canAnswer ? "cursor-pointer active:scale-[0.99]" : ""} ${tone}`}
                aria-pressed={isSelected}
              >
                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base font-bold ${revealed && isCorrect ? "bg-correct text-white" : revealed && isSelected ? "bg-wrong text-white" : "bg-black/5"}`}>
                  {LETTERS[k]}
                </span>
                <span className="min-w-0 flex-1 text-[17px] leading-snug">
                  {level === 1 && native ? (
                    <>
                      <span className="block">{tr!.options[k]}</span>
                      <span className="mt-0.5 block text-sm text-muted">
                        <GlossText text={q.options[k]} mode="plain" logicWords={logicWords} highlightLogic highlightAnchors={showAnchor} anchorKeys={anchorKeys} />
                      </span>
                    </>
                  ) : (
                    <GlossText text={q.options[k]} chunks={chunks} mode={glossMode} logicWords={logicWords} highlightLogic={highlightLogic} highlightAnchors={showAnchor} anchorKeys={anchorKeys} />
                  )}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      {level === 3 && native && (
        <button type="button" onClick={() => setTranslateAll((v) => !v)} className="mt-3 text-sm font-medium text-accent">
          {translateAll ? t("question.hideTranslation") : t("question.translateAll")}
        </button>
      )}

      {revealed && (
        <section className="mt-4 space-y-3 border-t border-black/5 pt-4 text-[15px]">
          {selected !== undefined && (
            <p className={`font-semibold ${selected === q.correct ? "text-correct" : "text-wrong"}`}>
              {selected === q.correct ? t("question.correct") : t("question.wrong", { letter: q.correct })}
            </p>
          )}
          {logicSwap && (
            <p className="rounded-lg bg-logic-soft p-3 text-sm">
              {t("question.logicSwap", { bad: logicSwap.bad.es, badTr: trOf(logicSwap.bad), good: logicSwap.good.es, goodTr: trOf(logicSwap.good) })}
            </p>
          )}
          {native && tr!.explanation && <p>{tr!.explanation}</p>}
          {native && anchorKeys.length > 0 && (
            <p className="rounded-lg bg-correct-soft p-3 text-sm">
              {t("question.anchorHint")} <strong>{anchorKeys.join(", ")}</strong>
              {tr!.gloss.options[q.correct].filter((c) => c.kind === "anchor").map((c) => ` (${c.tr.replace(/[.,;:]+$/, "")})`).join("")}
            </p>
          )}
          {native && anchorKeys.length === 0 && tr!.trap && <p className="rounded-lg bg-logic-soft p-3 text-sm">{tr!.trap}</p>}
          {native && anchorKeys.length > 0 && tr!.trap && <p className="text-sm text-muted">{tr!.trap}</p>}
          {native && tr!.legalRef && <p className="text-xs text-muted">{tr!.legalRef}</p>}
          {q.terms.length > 0 && (
            <p className="flex flex-wrap gap-1 text-xs">
              {q.terms.map((id) => (
                <Link key={id} href={`/${lang}/glossary/${id}/`} className="rounded-full bg-black/5 px-2 py-1 text-muted hover:bg-black/10">
                  {id.replace(/-/g, " ")}
                </Link>
              ))}
            </p>
          )}
          <p className="flex flex-wrap gap-3 text-xs text-muted">
            <a href={`mailto:brevete.peru.app@gmail.com?subject=${encodeURIComponent(`[${q.id}] error report`)}`} className="flex items-center gap-1 hover:underline">
              <Icon name="flag" className="h-4 w-4" /> {t("question.report")}
            </a>
            <ShareButton url={`/${lang}/${q.category}/q/${questionSlug(q.number, q.text)}/`} title={q.text} label={t("question.share")} />
          </p>
        </section>
      )}
    </article>
  );
}

function ShareButton({ url, title, label }: { url: string; title: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const full = `${location.origin}${url}`;
    try {
      if (navigator.share) await navigator.share({ title, url: full });
      else {
        await navigator.clipboard.writeText(full);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      /* cancelled */
    }
  };
  return (
    <button type="button" onClick={share} className="flex items-center gap-1 hover:underline">
      <Icon name="share" className="h-4 w-4" /> {copied ? "✓" : label}
    </button>
  );
}
