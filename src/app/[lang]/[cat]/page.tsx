import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { CategoryProgress } from "@/components/progress/CategoryProgress";
import { Icon } from "@/components/ui/Icon";
import { getCategories, getCategory, getQuestions, topicsWithQuestions } from "@/lib/content";
import { getDict } from "@/lib/dictionaries";
import { makeT } from "@/lib/i18n";
import { LANGS, type CategoryId, type Lang } from "@/lib/types";

export function generateStaticParams() {
  return LANGS.flatMap((lang) => getCategories().map((c) => ({ lang, cat: c.id })));
}

export default async function CategoryHub({ params }: { params: Promise<{ lang: Lang; cat: CategoryId }> }) {
  const { lang, cat } = await params;
  const category = getCategory(cat);
  if (!category) notFound();
  const t = makeT(getDict(lang));
  const questions = getQuestions(cat);
  const topics = topicsWithQuestions(cat).map((tp) => ({
    id: tp.id,
    title: tp.title[lang],
    count: questions.filter((q) => q.topic === tp.id).length,
    ids: questions.filter((q) => q.topic === tp.id).map((q) => q.id),
  }));
  const base = `/${lang}/${cat}`;
  const modes = [
    { href: `${base}/review/`, icon: "repeat", label: t("review.title"), desc: t("review.hubDesc") },
    { href: `${base}/practice/`, icon: "target", label: t("modes.practice"), desc: t("modes.practiceDesc") },
    { href: `${base}/mistakes/`, icon: "repeat", label: t("modes.mistakes"), desc: t("modes.mistakesDesc") },
    { href: `${base}/exam/`, icon: "clock", label: t("modes.exam"), desc: t("modes.examDesc") },
    { href: `${base}/pictures/`, icon: "image", label: t("modes.pictures"), desc: t("modes.picturesDesc") },
    { href: `${base}/twins/`, icon: "shuffle", label: t("modes.twins"), desc: t("modes.twinsDesc") },
    { href: `${base}/all/`, icon: "list", label: t("modes.all"), desc: t("modes.allDesc") },
  ];

  return (
    <AppShell lang={lang} t={t} title={category.title[lang]} back={`/${lang}/`} cat={cat}>
      <p className="text-sm text-muted">{category.description[lang]}</p>
      <p className="mt-1 text-sm text-muted">{t("hub.examInfo", { n: category.examQuestions, pass: category.passScore, min: category.timeLimitSec / 60 })}</p>

      <CategoryProgress cat={cat} topics={topics} />

      <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-muted">{t("hub.modes")}</h2>
      <ul className="grid grid-cols-2 gap-3">
        {modes.map((m) => (
          <li key={m.href}>
            <Link href={m.href} className="flex h-full flex-col gap-1 rounded-2xl bg-surface p-3 shadow-sm active:bg-accent-soft">
              <Icon name={m.icon} className="h-6 w-6 text-accent" />
              <span className="font-semibold">{m.label}</span>
              <span className="text-xs text-muted">{m.desc}</span>
            </Link>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
