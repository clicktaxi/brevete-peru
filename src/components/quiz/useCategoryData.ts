"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/components/providers";
import { loadCategoryData, loadGlossary, type CategoryData, type GlossaryData } from "@/lib/data";
import { precacheCategory } from "@/components/shell/ServiceWorker";

export function useCategoryData(cat: string) {
  const lang = useLang();
  const [data, setData] = useState<CategoryData | null>(null);
  const [glossary, setGlossary] = useState<GlossaryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([loadCategoryData(cat, lang), loadGlossary()])
      .then(([d, g]) => {
        if (!alive) return;
        setData(d);
        setGlossary(g);
        const urls = [`/data/${cat}.${lang}.json`, "/data/glossary.json", ...d.questions.filter((q) => q.image).map((q) => q.image!)];
        try {
          precacheCategory(urls);
        } catch {
          /* no sw */
        }
      })
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [cat, lang]);

  return { data, glossary, error };
}
