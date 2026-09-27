import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { ContinueButton } from "@/components/progress/ContinueButton";
import { InstallHint } from "@/components/shell/InstallHint";
import { Icon } from "@/components/ui/Icon";
import { getCategories } from "@/lib/content";
import { getDict } from "@/lib/dictionaries";
import { makeT } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

export default async function Home({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const t = makeT(getDict(lang));
  const categories = getCategories();
  return (
    <AppShell lang={lang} t={t} title={t("app.name")}>
      <p className="mb-4 text-muted">{t("home.tagline")}</p>
      <ContinueButton cat={categories[0].id} />
      <InstallHint />
      <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-muted">{t("home.categories")}</h2>
      <ul className="space-y-3">
        {categories.map((c) => (
          <li key={c.id}>
            <Link href={`/${lang}/${c.id}/`} className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm active:bg-accent-soft">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <CarIcon />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{c.code}</span>
                <span className="block text-sm text-muted">{c.description[lang]}</span>
              </span>
              <Icon name="chevron" className="h-5 w-5 text-muted" />
            </Link>
          </li>
        ))}
        {(["a2a", "a2b", "a3"] as const).map((id) => (
          <li key={id} className="flex items-center gap-3 rounded-2xl border border-dashed border-black/10 p-4 text-muted">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black/5">
              <CarIcon />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{t(`home.soon.${id}`)}</span>
              <span className="block text-sm">{t("home.comingSoon")}</span>
            </span>
          </li>
        ))}
      </ul>
      <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-muted">{t("home.tools")}</h2>
      <ul className="grid grid-cols-2 gap-3">
        {[
          ...(lang !== "es" ? [{ href: `/${lang}/vocab/`, icon: "bolt", label: t("tools.vocab") }] : []),
          { href: `/${lang}/traps/`, icon: "zap", label: t("tools.traps") },
          { href: `/${lang}/formulas/`, icon: "list", label: t("tools.formulas") },
          { href: `/${lang}/exam-ui/`, icon: "eye", label: t("tools.examUi") },
          { href: `/${lang}/glossary/`, icon: "book", label: t("tools.glossary") },
          { href: `/${lang}/how-to/`, icon: "info", label: t("tools.howTo") },
          { href: `/${lang}/history/`, icon: "history", label: t("tools.history") },
        ].map((it) => (
          <li key={it.href}>
            <Link href={it.href} className="flex h-full items-center gap-2 rounded-2xl bg-surface p-3 text-sm font-medium shadow-sm active:bg-accent-soft">
              <Icon name={it.icon} className="h-5 w-5 text-accent" />
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-center text-xs text-muted md:hidden">{t("app.disclaimer")}</p>
    </AppShell>
  );
}

function CarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 13l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5v5H3v-5zM3 13h18M7 18v2m10-2v2M7 15h.01M17 15h.01" />
    </svg>
  );
}
