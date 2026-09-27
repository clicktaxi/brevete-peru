import { Suspense } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { ExamResult } from "@/components/modes/ExamResult";
import { Loading } from "@/components/ui/Loading";
import { getCategories } from "@/lib/content";
import { getDict } from "@/lib/dictionaries";
import { makeT } from "@/lib/i18n";
import { LANGS, type CategoryId, type Lang } from "@/lib/types";

export function generateStaticParams() {
  return LANGS.flatMap((lang) => getCategories().map((c) => ({ lang, cat: c.id })));
}

export default async function ResultPage({ params }: { params: Promise<{ lang: Lang; cat: CategoryId }> }) {
  const { lang, cat } = await params;
  const t = makeT(getDict(lang));
  return (
    <AppShell lang={lang} t={t} title={t("exam.result")} back={`/${lang}/${cat}/exam/`} cat={cat}>
      <Suspense fallback={<Loading />}>
        <ExamResult cat={cat} />
      </Suspense>
    </AppShell>
  );
}
