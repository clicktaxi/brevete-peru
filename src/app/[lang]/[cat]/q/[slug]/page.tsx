import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { QuestionIsland } from "@/components/question/QuestionIsland";
import { getCategories, getCategory, getLogicWords, getQuestion, getQuestions, getTopics, getTranslation } from "@/lib/content";
import { getDict } from "@/lib/dictionaries";
import { makeT } from "@/lib/i18n";
import { questionSlug } from "@/lib/text";
import { LANGS, OPTION_KEYS, type CategoryId, type Lang } from "@/lib/types";

type Params = { lang: Lang; cat: CategoryId; slug: string };

export function generateStaticParams() {
  return LANGS.flatMap((lang) =>
    getCategories().flatMap((c) => getQuestions(c.id).map((q) => ({ lang, cat: c.id, slug: questionSlug(q.number, q.text) }))),
  );
}

function parse(slug: string) {
  const n = parseInt(slug.split("-")[0], 10);
  return Number.isFinite(n) ? n : NaN;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang, cat, slug } = await params;
  const q = getQuestion(cat, parse(slug));
  if (!q) return {};
  const tr = getTranslation(cat, lang, q.id);
  const path = `/${cat}/q/${questionSlug(q.number, q.text)}/`;
  return {
    title: `${q.number}. ${q.text}`,
    description: tr ? `${tr.gist}. ${tr.explanation}` : q.options[q.correct],
    alternates: {
      canonical: `/${lang}${path}`,
      languages: Object.fromEntries(LANGS.map((l) => [l, `/${l}${path}`])),
    },
    openGraph: { title: `${q.number}. ${q.text}`, description: tr?.gist ?? q.options[q.correct], images: q.image ? [q.image] : undefined },
  };
}

export default async function QuestionPage({ params }: { params: Promise<Params> }) {
  const { lang, cat, slug } = await params;
  const category = getCategory(cat);
  const q = getQuestion(cat, parse(slug));
  if (!category || !q) notFound();
  const t = makeT(getDict(lang));
  const tr = getTranslation(cat, lang, q.id);
  const topic = getTopics().find((tp) => tp.id === q.topic);
  const all = getQuestions(cat);
  const prev = all.find((x) => x.number === q.number - 1);
  const next = all.find((x) => x.number === q.number + 1);
  const twins = (q.twins ?? []).map((id) => all.find((x) => x.id === id)).filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: `${category.code} — ${q.number}`,
    about: topic?.title[lang],
    inLanguage: "es",
    hasPart: {
      "@type": "Question",
      name: q.text,
      eduQuestionType: "Multiple choice",
      acceptedAnswer: { "@type": "Answer", text: q.options[q.correct] },
      suggestedAnswer: OPTION_KEYS.filter((k) => k !== q.correct).map((k) => ({ "@type": "Answer", text: q.options[k] })),
    },
  };

  return (
    <AppShell lang={lang} t={t} title={t("question.number", { n: q.number })} back={`/${lang}/${cat}/all/`} cat={cat}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {topic && (
        <p className="mb-3 text-sm text-muted">
          <Link href={`/${lang}/${cat}/topic/${topic.id}/`} className="hover:underline">
            {topic.title[lang]}
          </Link>
        </p>
      )}
      <noscript>
        <div className="mb-4 rounded-2xl bg-surface p-4">
          <p className="text-lg font-semibold">{q.text}</p>
          <ol className="mt-3 space-y-1">
            {OPTION_KEYS.map((k) => (
              <li key={k} className={k === q.correct ? "font-semibold text-correct" : ""}>
                {k}) {q.options[k]}
              </li>
            ))}
          </ol>
          {tr && <p className="mt-3">{tr.explanation}</p>}
        </div>
      </noscript>
      <QuestionIsland question={q} translation={tr} logic={getLogicWords()} />
      {twins.length > 0 && (
        <section className="mt-4 rounded-2xl bg-surface p-4 text-sm shadow-sm">
          <h2 className="mb-2 font-semibold">{t("question.twins")}</h2>
          <ul className="space-y-1">
            {twins.map((tw) => (
              <li key={tw!.id}>
                <Link href={`/${lang}/${cat}/q/${questionSlug(tw!.number, tw!.text)}/`} className="text-accent hover:underline">
                  {tw!.number}. {tw!.text}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <nav className="mt-4 flex justify-between text-sm">
        {prev ? (
          <Link href={`/${lang}/${cat}/q/${questionSlug(prev.number, prev.text)}/`} className="rounded-full bg-surface px-4 py-2 shadow-sm">
            ← {prev.number}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/${lang}/${cat}/q/${questionSlug(next.number, next.text)}/`} className="rounded-full bg-surface px-4 py-2 shadow-sm">
            {next.number} →
          </Link>
        )}
      </nav>
    </AppShell>
  );
}
