import { AppShell } from "@/components/shell/AppShell";
import { TrapsMode } from "@/components/modes/TrapsMode";
import { getDict } from "@/lib/dictionaries";
import { makeT } from "@/lib/i18n";
import { LANGS, type Lang } from "@/lib/types";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export default async function TrapsPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const t = makeT(getDict(lang));
  return (
    <AppShell lang={lang} t={t} title={t("traps.title")} back={`/${lang}/`}>
      <TrapsMode />
    </AppShell>
  );
}
