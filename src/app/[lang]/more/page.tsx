import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { SettingsPanel } from "@/components/modes/SettingsPanel";
import { Icon } from "@/components/ui/Icon";
import { getCategories } from "@/lib/content";
import { getDict } from "@/lib/dictionaries";
import { makeT } from "@/lib/i18n";
import { LANGS, type Lang } from "@/lib/types";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export default async function MorePage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const t = makeT(getDict(lang));
  const links = [
    ...(lang !== "es" ? [{ href: `/${lang}/vocab/`, icon: "bolt", label: t("tools.vocab") }] : []),
    { href: `/${lang}/traps/`, icon: "zap", label: t("tools.traps") },
    { href: `/${lang}/formulas/`, icon: "list", label: t("tools.formulas") },
    { href: `/${lang}/exam-ui/`, icon: "eye", label: t("tools.examUi") },
    { href: `/${lang}/glossary/`, icon: "book", label: t("tools.glossary") },
    { href: `/${lang}/history/`, icon: "history", label: t("tools.history") },
    { href: `/${lang}/how-to/`, icon: "info", label: t("tools.howTo") },
    { href: `/${lang}/about/`, icon: "flag", label: t("tools.about") },
  ];
  return (
    <AppShell lang={lang} t={t} title={t("more.title")}>
      <ul className="divide-y divide-black/5 rounded-2xl bg-surface shadow-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="flex h-14 items-center gap-3 px-4">
              <Icon name={l.icon} className="h-5 w-5 text-accent" />
              <span className="flex-1 font-medium">{l.label}</span>
              <Icon name="chevron" className="h-4 w-4 text-muted" />
            </Link>
          </li>
        ))}
      </ul>
      <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-muted">{t("settings.title")}</h2>
      <SettingsPanel cats={getCategories().map((c) => c.id)} />
      <p className="mt-8 text-center text-xs text-muted">{t("app.disclaimer")}</p>
    </AppShell>
  );
}
