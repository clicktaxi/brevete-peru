"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang, useT } from "@/components/providers";
import { Icon } from "@/components/ui/Icon";

export function BottomNav({ cat }: { cat: string }) {
  const lang = useLang();
  const t = useT();
  const pathname = usePathname();
  const base = `/${lang}/${cat}`;
  const items = [
    { href: `${base}/`, icon: "book", label: t("nav.learn"), match: (p: string) => p === base || p.startsWith(`${base}/topic`) || p.startsWith(`${base}/study`) },
    { href: `${base}/practice/`, icon: "target", label: t("nav.practice"), match: (p: string) => p.startsWith(`${base}/practice`) || p.startsWith(`${base}/mistakes`) },
    { href: `${base}/exam/`, icon: "clock", label: t("nav.exam"), match: (p: string) => p.startsWith(`${base}/exam`) },
    { href: `/${lang}/more/`, icon: "more", label: t("nav.more"), match: (p: string) => p.startsWith(`/${lang}/more`) },
  ] as const;
  const path = pathname.replace(/\/$/, "");
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden" aria-label={t("nav.main")}>
      <ul className="mx-auto grid max-w-2xl grid-cols-4">
        {items.map((it) => {
          const active = it.match(path);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={`flex h-14 flex-col items-center justify-center gap-0.5 text-xs ${active ? "text-accent font-semibold" : "text-muted"}`}
                aria-current={active ? "page" : undefined}
              >
                <Icon name={it.icon} className="h-6 w-6" />
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
