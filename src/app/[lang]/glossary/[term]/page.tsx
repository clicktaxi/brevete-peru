import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { getCategories, getGlossary, getQuestions, getTopics } from "@/lib/content";
import { getDict } from "@/lib/dictionaries";
import { makeT } from "@/lib/i18n";
import { questionSlug } from "@/lib/text";
import { LANGS, type Lang } from "@/lib/types";

export function generateStaticParams() {
  return LANGS.flatMap((lang) => getGlossary().map((g) => ({ lang, term: g.id })));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang; term: string }> }): Promise<Metadata> {
  const { lang, term } = await params;
  const g = getGlossary().find((x) => x.id === term);
  if (!g) return {};
  return { title: `${g.es} — ${g.tr[lang] ?? g.tr.en ?? ""}`, alternates: { languages: Object.fromEntries(LANGS.map((l) => [l, `/${l}/glossary/${term}/`])) } };
}

export default async function TermPage({ params }: { params: Promise<{ lang: Lang; term: string }> }) {
  const { lang, term } = await params;
  const g = getGlossary().find((x) => x.id === term);
  if (!g) notFound();
  const t = makeT(getDict(lang));
  const topics = getTopics();
  const usage = getCategories().flatMap((c) => getQuestions(c.id).filter((q) => q.terms.includes(term)));
  return (
    <AppShell lang={lang} t={t} title={g.es} back={`/${lang}/glossary/`}>
      <div className="rounded-3xl bg-surface p-6 text-center shadow-sm">
        <p className="text-3xl font-bold">{g.es}</p>
        {g.forms?.length ? <p className="mt-1 text-sm text-muted">{g.forms.join(" · ")}</p> : null}
        <p className="mt-4 text-2xl font-semibold text-accent">{g.tr[lang] ?? g.tr.en}</p>
        {g.note?.[lang] && <p className="mt-3 text-muted">{g.note[lang]}</p>}
      </div>
      {g.topics?.length ? (
        <p className="mt-3 flex flex-wrap gap-1 text-xs">
          {g.topics.map((id) => (
            <span key={id} className="rounded-full bg-black/5 px-2 py-1 text-muted">
              {topics.find((tp) => tp.id === id)?.title[lang] ?? id}
            </span>
          ))}
        </p>
      ) : null}
      {usage.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">{t("glossary.example", { n: usage.length })}</h2>
          <ul className="space-y-2">
            {usage.map((q) => (
              <li key={q.id}>
                <Link href={`/${lang}/${q.category}/q/${questionSlug(q.number, q.text)}/`} className="block rounded-2xl bg-surface p-3 text-sm shadow-sm">
                  <span className="font-semibold text-muted">{q.number}.</span> {q.text}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AppShell>
  );
}
