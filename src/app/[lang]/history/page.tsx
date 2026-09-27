import { AppShell } from "@/components/shell/AppShell";
import { HistoryMode } from "@/components/modes/HistoryMode";
import { getCategories } from "@/lib/content";
import { getDict } from "@/lib/dictionaries";
import { makeT } from "@/lib/i18n";
import { LANGS, type Lang } from "@/lib/types";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export default async function HistoryPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const t = makeT(getDict(lang));
  return (
    <AppShell lang={lang} t={t} title={t("history.title")} back={`/${lang}/`}>
      <HistoryMode cats={getCategories().map((c) => c.id)} />
    </AppShell>
  );
}
