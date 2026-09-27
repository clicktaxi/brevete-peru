"use client";

import { useRef, useState } from "react";
import { useSettings, useT } from "@/components/providers";
import { HelpLevelSwitch } from "@/components/question/HelpLevelSwitch";
import { exportProgress, importProgress, resetProgress, type ProgressExport } from "@/lib/progress";

export function SettingsPanel({ cats }: { cats: string[] }) {
  const t = useT();
  const { settings, setSettings } = useSettings();
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");

  const download = async () => {
    const data = await exportProgress(cats);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `brevete-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const upload = async (f: File | undefined) => {
    if (!f) return;
    try {
      const data = JSON.parse(await f.text()) as ProgressExport;
      await importProgress(data, cats);
      setMsg(t("settings.imported"));
      setTimeout(() => location.reload(), 800);
    } catch {
      setMsg(t("settings.importError"));
    }
  };

  const themes = [
    ["system", t("settings.themeSystem")],
    ["light", t("settings.themeLight")],
    ["dark", t("settings.themeDark")],
  ] as const;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-surface p-4 shadow-sm">
        <p className="mb-2 text-sm font-medium">{t("settings.helpLevel")}</p>
        <HelpLevelSwitch value={settings.helpLevel} onChange={(helpLevel) => setSettings({ helpLevel })} />
        <ul className="mt-2 space-y-0.5 text-xs text-muted">
          {[1, 2, 3, 4].map((l) => (
            <li key={l}>
              <b>{l}</b> — {t(`help.explain${l}`)}
            </li>
          ))}
        </ul>
      </div>
      <label className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm">
        <input type="checkbox" checked={settings.shuffleOptions} onChange={(e) => setSettings({ shuffleOptions: e.target.checked })} className="h-5 w-5 accent-accent" />
        <span className="flex-1">
          <span className="block font-medium">{t("settings.shuffle")}</span>
          <span className="block text-xs text-muted">{t("settings.shuffleHint")}</span>
        </span>
      </label>
      <div className="rounded-2xl bg-surface p-4 shadow-sm">
        <p className="mb-2 text-sm font-medium">{t("settings.theme")}</p>
        <div className="flex gap-2">
          {themes.map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setSettings({ theme: v });
                try {
                  localStorage.setItem("theme", v);
                } catch {
                  /* ignore */
                }
              }}
              className={`h-10 flex-1 rounded-full text-sm font-semibold ${settings.theme === v ? "bg-accent text-white" : "bg-black/5"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2 rounded-2xl bg-surface p-4 shadow-sm">
        <button type="button" onClick={download} className="h-12 w-full rounded-full bg-black/5 font-semibold">
          {t("settings.export")}
        </button>
        <button type="button" onClick={() => file.current?.click()} className="h-12 w-full rounded-full bg-black/5 font-semibold">
          {t("settings.import")}
        </button>
        <input ref={file} type="file" accept="application/json" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
        <button
          type="button"
          onClick={async () => {
            if (confirm(t("settings.resetConfirm"))) {
              await resetProgress();
              location.reload();
            }
          }}
          className="h-12 w-full rounded-full text-sm font-semibold text-wrong"
        >
          {t("settings.reset")}
        </button>
        {msg && <p className="text-center text-sm text-muted">{msg}</p>}
      </div>
    </div>
  );
}
