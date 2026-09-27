import type { MetadataRoute } from "next";
import { getCategories, getGlossary, getQuestions, topicsWithQuestions } from "@/lib/content";
import { questionSlug } from "@/lib/text";
import { LANGS } from "@/lib/types";

export const dynamic = "force-static";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://brevete.pe";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths: string[] = ["", "/glossary", "/traps", "/formulas", "/exam-ui", "/how-to", "/about"];
  for (const c of getCategories()) {
    paths.push(`/${c.id}`, `/${c.id}/all`, `/${c.id}/practice`, `/${c.id}/exam`, `/${c.id}/pictures`, `/${c.id}/twins`);
    for (const tp of topicsWithQuestions(c.id)) paths.push(`/${c.id}/topic/${tp.id}`);
    for (const q of getQuestions(c.id)) paths.push(`/${c.id}/q/${questionSlug(q.number, q.text)}`);
  }
  for (const g of getGlossary()) paths.push(`/glossary/${g.id}`);
  return paths.flatMap((p) =>
    LANGS.map((lang) => ({
      url: `${SITE}/${lang}${p}/`,
      alternates: { languages: Object.fromEntries(LANGS.map((l) => [l, `${SITE}/${l}${p}/`])) },
    })),
  );
}
