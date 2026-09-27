"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLang, useT } from "@/components/providers";
import { Icon } from "@/components/ui/Icon";
import { LANG_NAMES, switchLangPath } from "@/lib/i18n";
import { LANGS } from "@/lib/types";

export function LangSwitcher() {
  const lang = useLang();
  const t = useT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 items-center gap-1 rounded-full px-3 text-sm font-medium text-muted hover:bg-black/5"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t("common.language")}: ${lang.toUpperCase()}`}
      >
        <Icon name="globe" />
        {lang.toUpperCase()}
      </button>
      {open && (
        <ul role="menu" className="absolute right-0 z-40 mt-1 w-40 overflow-hidden rounded-xl border border-black/5 bg-surface shadow-lg">
          {LANGS.map((l) => (
            <li key={l} role="none">
              <Link
                role="menuitem"
                href={switchLangPath(pathname, l)}
                onClick={() => setOpen(false)}
                className={`block px-4 py-3 text-sm ${l === lang ? "font-semibold text-accent" : ""}`}
                hrefLang={l}
              >
                {LANG_NAMES[l]}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
