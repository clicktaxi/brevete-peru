import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { TopicStep } from "@/components/modes/TopicStep";
import { getCategories, getTopics, topicsWithQuestions } from "@/lib/content";
import { getDict } from "@/lib/dictionaries";
import { makeT } from "@/lib/i18n";
import { STEP_IDS, type StepId } from "@/lib/steps";
import { LANGS, type CategoryId, type Lang } from "@/lib/types";

export function generateStaticParams() {
  return LANGS.flatMap((lang) =>
    getCategories().flatMap((c) => topicsWithQuestions(c.id).flatMap((tp) => STEP_IDS.map((step) => ({ lang, cat: c.id, topic: tp.id, step })))),
  );
}

export default async function StepPage({ params }: { params: Promise<{ lang: Lang; cat: CategoryId; topic: string; step: StepId }> }) {
  const { lang, cat, topic, step } = await params;
  const tp = getTopics().find((x) => x.id === topic);
  if (!tp || !STEP_IDS.includes(step)) notFound();
  const t = makeT(getDict(lang));
  return (
    <AppShell lang={lang} t={t} title={`${t(`steps.${step}`)} · ${tp.title[lang]}`} back={`/${lang}/${cat}/topic/${topic}/`} cat={cat}>
      <TopicStep cat={cat} topic={topic} step={step} />
    </AppShell>
  );
}
