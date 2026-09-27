import { AppShell } from "@/components/shell/AppShell";
import { getCategories } from "@/lib/content";
import { getDict } from "@/lib/dictionaries";
import { makeT } from "@/lib/i18n";
import { LANGS, type Lang } from "@/lib/types";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export default async function AboutPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const t = makeT(getDict(lang));
  return (
    <AppShell lang={lang} t={t} title={t("about.title")} back={`/${lang}/`}>
      <div className="space-y-3 rounded-2xl bg-surface p-4 shadow-sm">
        <p>{t("about.p1")}</p>
        <p>{t("about.p2")}</p>
        <p className="text-muted">{t("about.p3")}</p>
        <p className="text-muted">{t("about.offline")}</p>
        <p className="text-muted">{t("about.noTracking")}</p>
        <ul className="text-sm">
          {getCategories().map((c) => (
            <li key={c.id}>
              <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline">
                {t("about.source")} — {c.code}
              </a>
              <span className="block text-xs text-muted">{c.sourceVersion}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-6 text-center text-xs text-muted">{t("app.disclaimer")}</p>
    </AppShell>
  );
}
