import { AppShell } from "@/components/shell/AppShell";
import { Icon } from "@/components/ui/Icon";
import { getDict } from "@/lib/dictionaries";
import { makeT } from "@/lib/i18n";
import { LANGS, type Lang } from "@/lib/types";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export default async function HowToPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const t = makeT(getDict(lang));
  return (
    <AppShell lang={lang} t={t} title={t("howTo.title")} back={`/${lang}/`}>
      <div className="rounded-2xl bg-surface p-4 shadow-sm">
        <p className="text-muted">{t("howTo.body")}</p>
      </div>
      <a href="https://sierdgtt.mtc.gob.pe/" target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center gap-3 rounded-2xl bg-accent-soft p-4 text-sm">
        <Icon name="share" className="h-5 w-5 shrink-0 text-accent" />
        <span>
          <span className="block font-semibold text-accent">{t("examUi.official")}</span>
          <span className="block text-muted">{t("examUi.officialHint")}</span>
        </span>
      </a>
    </AppShell>
  );
}
