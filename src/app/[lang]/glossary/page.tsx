import { AppShell } from "@/components/shell/AppShell";
import { GlossaryList } from "@/components/modes/GlossaryList";
import { getGlossary, getLogicWords } from "@/lib/content";
import { getDict } from "@/lib/dictionaries";
import { makeT } from "@/lib/i18n";
import { LANGS, type Lang } from "@/lib/types";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export default async function GlossaryPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const t = makeT(getDict(lang));
  const terms = getGlossary().map((g) => ({ id: g.id, es: g.es, tr: g.tr[lang] ?? g.tr.en ?? "", forms: g.forms ?? [] }));
  const logic = getLogicWords().map((w) => ({ es: w.es, tr: w.tr[lang] ?? w.tr.en ?? "" }));
  return (
    <AppShell lang={lang} t={t} title={t("glossary.title")} back={`/${lang}/`}>
      <GlossaryList terms={terms} logic={logic} />
    </AppShell>
  );
}
