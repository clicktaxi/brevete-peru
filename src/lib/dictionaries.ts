import "server-only";
import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import type { Lang } from "./types";
import { isLang, type Dict } from "./i18n";

const cache = new Map<Lang, Dict>();

export function getDict(lang: Lang): Dict {
  if (!isLang(lang)) notFound();
  if (!cache.has(lang)) {
    const file = path.join(process.cwd(), "messages", `${lang}.json`);
    cache.set(lang, JSON.parse(fs.readFileSync(file, "utf8")));
  }
  return cache.get(lang)!;
}
