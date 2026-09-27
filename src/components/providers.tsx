"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { makeT, type Dict, type TFunction } from "@/lib/i18n";
import { defaultHelpLevel, getSettings, updateSettings, type HelpLevel, type Settings } from "@/lib/progress";
import type { Lang } from "@/lib/types";

interface I18nContextValue {
  lang: Lang;
  t: TFunction;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ lang, dict, children }: { lang: Lang; dict: Dict; children: ReactNode }) {
  const value = useMemo(() => ({ lang, t: makeT(dict) }), [lang, dict]);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): TFunction {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT outside I18nProvider");
  return ctx.t;
}

export function useLang(): Lang {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useLang outside I18nProvider");
  return ctx.lang;
}

interface SettingsContextValue {
  settings: Settings;
  ready: boolean;
  setSettings: (patch: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const [settings, setLocal] = useState<Settings>({
    helpLevel: defaultHelpLevel(lang),
    shuffleOptions: false,
    theme: "system",
    speechRate: 1,
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    getSettings()
      .then((s) => {
        if (alive) setLocal(s);
      })
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = settings.theme === "dark" || (settings.theme === "system" && media.matches);
      root.dataset.theme = dark ? "dark" : "light";
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [settings.theme]);

  const setSettings = useCallback((patch: Partial<Settings>) => {
    setLocal((prev) => ({ ...prev, ...patch }));
    void updateSettings(patch);
  }, []);

  const value = useMemo(() => ({ settings, ready, setSettings }), [settings, ready, setSettings]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings outside SettingsProvider");
  return ctx;
}

export function useHelpLevel(): [HelpLevel, (l: HelpLevel) => void] {
  const { settings, setSettings } = useSettings();
  return [settings.helpLevel, (helpLevel) => setSettings({ helpLevel })];
}
