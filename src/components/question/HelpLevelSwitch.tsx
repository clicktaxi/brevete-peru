"use client";

import { useT } from "@/components/providers";
import type { HelpLevel } from "@/lib/progress";

const LEVELS: HelpLevel[] = [1, 2, 3, 4];

export function HelpLevelSwitch({ value, onChange, compact }: { value: HelpLevel; onChange: (l: HelpLevel) => void; compact?: boolean }) {
  const t = useT();
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label={t("help.title")}>
      {!compact && <span className="mr-1 text-xs text-muted">{t("help.title")}</span>}
      {LEVELS.map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={value === l}
          onClick={() => onChange(l)}
          aria-label={`${l} — ${t(`help.level${l}`)}`}
          className={`h-9 min-w-9 rounded-full px-2 text-sm font-semibold transition ${
            value === l ? "bg-accent text-white" : "bg-black/5 text-muted hover:bg-black/10"
          }`}
        >
          {l}
        </button>
      ))}
      {!compact && <span className="ml-1 hidden text-xs text-muted sm:inline">{t(`help.level${value}`)}</span>}
    </div>
  );
}
