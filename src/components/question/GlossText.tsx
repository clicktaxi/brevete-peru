"use client";

import { useEffect, useRef, useState } from "react";
import { markWords } from "@/lib/text";
import type { GlossChunk } from "@/lib/types";

export type GlossMode = "plain" | "inline" | "tap";

interface Props {
  text: string;
  chunks?: GlossChunk[];
  mode: GlossMode;
  logicWords: string[];
  highlightLogic: boolean;
  highlightAnchors?: boolean;
  /** anchor phrases to underline even when the chunks carry no `kind` */
  anchorKeys?: string[];
  className?: string;
}

function Words({ text, logicWords, highlightLogic, anchorKeys }: { text: string; logicWords: string[]; highlightLogic: boolean; anchorKeys?: string[] }) {
  const pieces = markWords(text, highlightLogic ? logicWords : []);
  if (!anchorKeys?.length) {
    return (
      <>
        {pieces.map((p, i) =>
          p.hit ? (
            <mark key={i} className="rounded bg-logic-soft px-0.5 font-semibold text-logic">
              {p.text}
            </mark>
          ) : (
            <span key={i}>{p.text}</span>
          ),
        )}
      </>
    );
  }
  return (
    <>
      {pieces.map((p, i) =>
        p.hit ? (
          <mark key={i} className="rounded bg-logic-soft px-0.5 font-semibold text-logic">
            {p.text}
          </mark>
        ) : (
          markWords(p.text, anchorKeys).map((a, j) =>
            a.hit ? (
              <mark key={`${i}-${j}`} className="rounded bg-correct-soft px-0.5 font-semibold text-correct">
                {a.text}
              </mark>
            ) : (
              <span key={`${i}-${j}`}>{a.text}</span>
            ),
          )
        ),
      )}
    </>
  );
}

export function GlossText({ text, chunks, mode, logicWords, highlightLogic, highlightAnchors, anchorKeys, className = "" }: Props) {
  const [open, setOpen] = useState<number | null>(null);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (open === null) return;
    const close = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  if (mode === "plain" || !chunks?.length) {
    return (
      <span className={className}>
        <Words text={text} logicWords={logicWords} highlightLogic={highlightLogic} anchorKeys={highlightAnchors ? anchorKeys : undefined} />
      </span>
    );
  }

  return (
    <span ref={ref} className={`${className} inline`}>
      {chunks.map((c, i) => {
        const isAnchor = highlightAnchors && (c.kind === "anchor" || anchorKeys?.some((k) => c.es.toLowerCase().includes(k.toLowerCase())));
        const isLogic = highlightLogic && c.kind === "logic";
        const base = "inline-flex flex-col align-top mr-1.5 mb-1 rounded px-0.5";
        const tone = isAnchor ? "bg-correct-soft" : isLogic ? "bg-logic-soft" : "";
        if (mode === "inline") {
          return (
            <span key={i} className={`${base} ${tone}`}>
              <span className={isAnchor ? "font-semibold text-correct" : ""}>
                <Words text={c.es} logicWords={logicWords} highlightLogic={highlightLogic && !isAnchor} />
              </span>
              <span className="text-[0.72em] leading-tight text-muted">{c.tr}</span>
            </span>
          );
        }
        return (
          <span key={i} className={`${base} relative ${tone}`}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(open === i ? null : i);
              }}
              className={`text-left ${isAnchor ? "font-semibold text-correct" : ""} underline decoration-dotted decoration-muted/60 underline-offset-4`}
              aria-expanded={open === i}
            >
              <Words text={c.es} logicWords={logicWords} highlightLogic={highlightLogic && !isAnchor} />
            </button>
            {open === i && (
              <span role="tooltip" className="absolute left-0 top-full z-30 mt-1 w-max max-w-[70vw] rounded-lg bg-ink px-3 py-2 text-sm font-normal text-bg shadow-lg">
                {c.tr}
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
