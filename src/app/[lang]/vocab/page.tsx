import { AppShell } from "@/components/shell/AppShell";
import { VocabTrainer } from "@/components/modes/VocabTrainer";
import { getDict } from "@/lib/dictionaries";
import { makeT } from "@/lib/i18n";
import { LANGS, type Lang } from "@/lib/types";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export default async function VocabPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const t = makeT(getDict(lang));
  return (
    <AppShell lang={lang} t={t} title={t("vocab.title")} back={`/${lang}/`}>
      {lang === "es" ? <p className="rounded-2xl bg-surface p-4 text-muted">{t("vocab.nativeOnly")}</p> : <VocabTrainer />}
    </AppShell>
  );
}
