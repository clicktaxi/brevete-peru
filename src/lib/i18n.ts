import { LANGS, type Lang } from "./types";

export type Dict = Record<string, unknown>;

export const DEFAULT_LANG: Lang = "ru";

export function isLang(value: string | undefined): value is Lang {
  return !!value && (LANGS as readonly string[]).includes(value);
}

export function lookup(dict: Dict, key: string): string | undefined {
  let node: unknown = dict;
  for (const part of key.split(".")) {
    if (node && typeof node === "object" && part in (node as Dict)) node = (node as Dict)[part];
    else return undefined;
  }
  return typeof node === "string" ? node : undefined;
}

export function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export function makeT(dict: Dict) {
  return (key: string, vars?: Record<string, string | number>): string => {
    const value = lookup(dict, key);
    if (value === undefined) {
      if (process.env.NODE_ENV !== "production") console.warn(`[i18n] missing key: ${key}`);
      return key;
    }
    return interpolate(value, vars);
  };
}

export type TFunction = ReturnType<typeof makeT>;

/** Replaces the language prefix of a path: /ru/a1/practice -> /en/a1/practice */
export function switchLangPath(pathname: string, lang: Lang): string {
  const parts = pathname.split("/");
  if (isLang(parts[1])) parts[1] = lang;
  else parts.splice(1, 0, lang);
  return parts.join("/") || `/${lang}`;
}

export const LANG_NAMES: Record<Lang, string> = { ru: "Русский", en: "English", es: "Español" };
