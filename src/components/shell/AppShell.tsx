import Link from "next/link";
import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { LangSwitcher } from "./LangSwitcher";
import { Icon } from "@/components/ui/Icon";
import type { Lang } from "@/lib/types";
import type { TFunction } from "@/lib/i18n";

interface Props {
  lang: Lang;
  t: TFunction;
  title: string;
  back?: string;
  cat?: string;
  children: ReactNode;
  /** hides bottom nav + language switcher (exam mode) */
  bare?: boolean;
  actions?: ReactNode;
}

export function AppShell({ lang, t, title, back, cat = "a1", children, bare, actions }: Props) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col">
      <header className="sticky top-0 z-20 flex h-14 items-center gap-1 border-b border-black/5 bg-bg/90 px-2 backdrop-blur">
        {back ? (
          <Link href={back} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-black/5" aria-label={t("common.back")}>
            <Icon name="back" />
          </Link>
        ) : (
          <Link href={`/${lang}/`} className="flex h-11 items-center px-2 font-bold text-accent" aria-label={t("app.name")}>
            <span aria-hidden="true">🇵🇪</span>
          </Link>
        )}
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold">{title}</h1>
        {actions}
        {!bare && <LangSwitcher />}
      </header>
      <main className={`flex-1 px-4 pt-4 ${bare ? "pb-8" : "pb-24 md:pb-8"}`}>{children}</main>
      {!bare && (
        <footer className="hidden px-4 pb-6 text-center text-xs text-muted md:block">{t("app.disclaimer")}</footer>
      )}
      {!bare && <BottomNav cat={cat} />}
    </div>
  );
}
