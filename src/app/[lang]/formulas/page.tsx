import { AppShell } from "@/components/shell/AppShell";
import { getFormulas } from "@/lib/content";
import { getDict } from "@/lib/dictionaries";
import { makeT } from "@/lib/i18n";
import { LANGS, type Lang } from "@/lib/types";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export default async function FormulasPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const t = makeT(getDict(lang));
  const formulas = getFormulas().sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  const groups = [
    { kind: "question" as const, title: t("formulas.question") },
    { kind: "option" as const, title: t("formulas.option") },
  ];
  return (
    <AppShell lang={lang} t={t} title={t("formulas.title")} back={`/${lang}/`}>
      <p className="text-sm text-muted">{t("formulas.intro")}</p>
      {groups.map((g) => (
        <section key={g.kind} className="mt-5">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">{g.title}</h2>
          <ul className="space-y-2">
            {formulas
              .filter((f) => f.kind === g.kind)
              .map((f) => (
                <li key={f.id} className="rounded-2xl bg-surface p-4 shadow-sm">
                  <p className="text-lg font-semibold">«{f.es}»</p>
                  {lang !== "es" && <p className="text-accent">{f.tr[lang] ?? f.tr.en}</p>}
                  {f.note?.[lang] && <p className="mt-1 text-sm text-muted">{f.note[lang]}</p>}
                  {f.count ? <p className="mt-1 text-xs text-muted">{t("formulas.count", { n: f.count })}</p> : null}
                </li>
              ))}
          </ul>
        </section>
      ))}
    </AppShell>
  );
}
