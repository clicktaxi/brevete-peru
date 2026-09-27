import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { TopicPath } from "@/components/progress/TopicPath";
import { Icon } from "@/components/ui/Icon";
import { getCategories, getGlossary, getQuestions, getTopics, topicsWithQuestions } from "@/lib/content";
import { getDict } from "@/lib/dictionaries";
import { makeT } from "@/lib/i18n";
import { topicTerms } from "@/lib/topic";
import { LANGS, type CategoryId, type Lang } from "@/lib/types";

export function generateStaticParams() {
  return LANGS.flatMap((lang) => getCategories().flatMap((c) => topicsWithQuestions(c.id).map((tp) => ({ lang, cat: c.id, topic: tp.id }))));
}

export default async function TopicPage({ params }: { params: Promise<{ lang: Lang; cat: CategoryId; topic: string }> }) {
  const { lang, cat, topic } = await params;
  const tp = getTopics().find((x) => x.id === topic);
  if (!tp) notFound();
  const t = makeT(getDict(lang));
  const questions = getQuestions(cat).filter((q) => q.topic === topic);
  const words = topicTerms(getQuestions(cat), topic, getGlossary());
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.slice(0, 20).map((q) => ({
      "@type": "Question",
      name: q.text,
      acceptedAnswer: { "@type": "Answer", text: q.options[q.correct] },
    })),
  };
  return (
    <AppShell lang={lang} t={t} title={tp.title[lang]} back={`/${lang}/${cat}/`} cat={cat}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <p className="text-sm text-muted">
        {t("practice.count", { n: questions.length })} · {t("steps.words")}: {words.length}
      </p>
      <TopicPath cat={cat} topic={topic} wordsTotal={words.length} questionIds={questions.map((q) => q.id)} />
      <Link href={`/${lang}/${cat}/study/${topic}/`} className="mt-4 flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm active:bg-accent-soft">
        <Icon name="eye" className="h-6 w-6 text-accent" />
        <span className="flex-1">
          <span className="block font-semibold">{t("modes.study")}</span>
          <span className="block text-xs text-muted">{t("modes.studyDesc")}</span>
        </span>
        <Icon name="chevron" className="h-5 w-5 text-muted" />
      </Link>
      <Link href={`/${lang}/${cat}/practice/?topic=${topic}`} className="mt-2 flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm active:bg-accent-soft">
        <Icon name="target" className="h-6 w-6 text-accent" />
        <span className="flex-1">
          <span className="block font-semibold">{t("modes.practice")}</span>
          <span className="block text-xs text-muted">{t("modes.practiceDesc")}</span>
        </span>
        <Icon name="chevron" className="h-5 w-5 text-muted" />
      </Link>
    </AppShell>
  );
}
