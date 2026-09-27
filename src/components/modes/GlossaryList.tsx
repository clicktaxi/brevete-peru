"use client";

import Link from "next/link";
import { useState } from "react";
import { useLang, useT } from "@/components/providers";
import { Icon } from "@/components/ui/Icon";
import { fold } from "@/lib/text";

interface TermRow {
  id: string;
  es: string;
  tr: string;
  forms: string[];
}

export function GlossaryList({ terms, logic }: { terms: TermRow[]; logic: { es: string; tr: string }[] }) {
  const t = useT();
  const lang = useLang();
  const [q, setQ] = useState("");
  const f = fold(q.trim());
  const list = f ? terms.filter((x) => fold(x.es).includes(f) || fold(x.tr).includes(f) || x.forms.some((fm) => fold(fm).includes(f))) : terms;
  const logicList = f ? logic.filter((x) => fold(x.es).includes(f) || fold(x.tr).includes(f)) : logic;

  return (
    <div className="space-y-4">
      <label className="relative block">
        <Icon name="search" className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-muted" />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("glossary.searchPlaceholder")} className="h-12 w-full rounded-xl border border-black/10 bg-surface pl-10 pr-3 text-base" />
      </label>
      {logicList.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">{t("glossary.logicTitle")}</h2>
          <ul className="flex flex-wrap gap-2">
            {logicList.map((w) => (
              <li key={w.es} className="rounded-full bg-logic-soft px-3 py-1.5 text-sm">
                <span className="font-semibold text-logic">{w.es}</span> <span className="text-muted">— {w.tr}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
          {t("glossary.termsTitle")} · {list.length}
        </h2>
        <ul className="divide-y divide-black/5 rounded-2xl bg-surface shadow-sm">
          {list.map((x) => (
            <li key={x.id}>
              <Link href={`/${lang}/glossary/${x.id}/`} className="flex items-center gap-2 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{x.es}</span>
                  <span className="block text-sm text-muted">{x.tr}</span>
                </span>
                <Icon name="chevron" className="h-4 w-4 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
