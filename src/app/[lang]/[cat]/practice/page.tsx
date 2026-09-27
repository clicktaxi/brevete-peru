import { Suspense } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { PracticeMode } from "@/components/modes/PracticeMode";
import { PracticeFromQuery } from "@/components/modes/PracticeFromQuery";
import { getCategories } from "@/lib/content";
import { getDict } from "@/lib/dictionaries";
import { makeT } from "@/lib/i18n";
import { LANGS, type CategoryId, type Lang } from "@/lib/types";

export function generateStaticParams() {
  return LANGS.flatMap((lang) => getCategories().map((c) => ({ lang, cat: c.id })));
}

export default async function PracticePage({ params }: { params: Promise<{ lang: Lang; cat: CategoryId }> }) {
  const { lang, cat } = await params;
  const t = makeT(getDict(lang));
  return (
    <AppShell lang={lang} t={t} title={t("practice.title")} back={`/${lang}/${cat}/`} cat={cat}>
      <Suspense fallback={<PracticeMode cat={cat} />}>
        <PracticeFromQuery cat={cat} />
      </Suspense>
    </AppShell>
  );
}
