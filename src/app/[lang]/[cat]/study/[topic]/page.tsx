import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { StudyMode } from "@/components/modes/StudyMode";
import { getCategories, getTopics, topicsWithQuestions } from "@/lib/content";
import { getDict } from "@/lib/dictionaries";
import { makeT } from "@/lib/i18n";
import { LANGS, type CategoryId, type Lang } from "@/lib/types";

export function generateStaticParams() {
  return LANGS.flatMap((lang) => getCategories().flatMap((c) => topicsWithQuestions(c.id).map((tp) => ({ lang, cat: c.id, topic: tp.id }))));
}

export default async function StudyPage({ params }: { params: Promise<{ lang: Lang; cat: CategoryId; topic: string }> }) {
  const { lang, cat, topic } = await params;
  const tp = getTopics().find((x) => x.id === topic);
  if (!tp) notFound();
  const t = makeT(getDict(lang));
  return (
    <AppShell lang={lang} t={t} title={`${t("study.title")} · ${tp.title[lang]}`} back={`/${lang}/${cat}/topic/${topic}/`} cat={cat}>
      <StudyMode cat={cat} topic={topic} />
    </AppShell>
  );
}
