import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { HomeDashboard } from "@/components/progress/HomeDashboard";
import { InstallHint } from "@/components/shell/InstallHint";
import { Icon } from "@/components/ui/Icon";
import { getCategories } from "@/lib/content";
import { getDict } from "@/lib/dictionaries";
import { makeT } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

export default async function Home({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const t = makeT(getDict(lang));
  const category = getCategories()[0];
  const tools = [
    ...(lang !== "es" ? [{ href: `/${lang}/vocab/`, icon: "bolt", label: t("tools.vocab") }] : []),
    { href: `/${lang}/traps/`, icon: "zap", label: t("tools.traps") },
    { href: `/${lang}/${category.id}/pictures/`, icon: "image", label: t("modes.pictures") },
    { href: `/${lang}/${category.id}/twins/`, icon: "shuffle", label: t("modes.twins") },
    { href: `/${lang}/formulas/`, icon: "list", label: t("tools.formulas") },
    { href: `/${lang}/exam-ui/`, icon: "eye", label: t("tools.examUi") },
    { href: `/${lang}/glossary/`, icon: "book", label: t("tools.glossary") },
    { href: `/${lang}/${category.id}/all/`, icon: "search", label: t("modes.all") },
  ];
  return (
    <AppShell lang={lang} t={t} title={t("app.name")}>
      <p className="mb-4 text-sm text-muted">{t("home.tagline")}</p>
      <HomeDashboard cat={category.id} code={category.code} />
      <InstallHint />
      <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-muted">{t("home.tools")}</h2>
      <ul className="grid grid-cols-2 gap-2">
        {tools.map((it) => (
          <li key={it.href}>
            <Link href={it.href} className="flex h-full min-h-12 items-center gap-2 rounded-2xl bg-surface px-3 py-2 text-sm font-medium shadow-sm active:bg-accent-soft">
              <Icon name={it.icon} className="h-5 w-5 shrink-0 text-accent" />
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-center text-xs text-muted">{t("home.otherSoon")}</p>
      <p className="mt-2 text-center text-xs text-muted md:hidden">{t("app.disclaimer")}</p>
    </AppShell>
  );
}
