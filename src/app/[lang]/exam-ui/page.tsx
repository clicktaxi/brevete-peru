import { AppShell } from "@/components/shell/AppShell";
import { Icon } from "@/components/ui/Icon";
import { getDict } from "@/lib/dictionaries";
import { makeT } from "@/lib/i18n";
import { LANGS, type Lang } from "@/lib/types";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

const ITEMS: { es: string; key: string }[] = [
  { es: "Iniciar examen", key: "iniciar" },
  { es: "Pregunta 12 de 40", key: "pregunta" },
  { es: "Tiempo restante 39:58", key: "tiempo" },
  { es: "Alternativa", key: "alternativa" },
  { es: "Marcar respuesta", key: "marcar" },
  { es: "Siguiente", key: "siguiente" },
  { es: "Anterior", key: "anterior" },
  { es: "Respondidas", key: "respondidas" },
  { es: "Sin responder", key: "sinResponder" },
  { es: "Finalizar", key: "finalizar" },
  { es: "Confirmar", key: "confirmar" },
  { es: "Puntaje", key: "puntaje" },
  { es: "APROBADO", key: "aprobado" },
  { es: "DESAPROBADO", key: "desaprobado" },
];

export default async function ExamUiPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const t = makeT(getDict(lang));
  return (
    <AppShell lang={lang} t={t} title={t("examUi.title")} back={`/${lang}/`}>
      <p className="text-sm text-muted">{t("examUi.intro")}</p>
      <div className="mt-4 rounded-2xl border border-black/10 bg-surface p-3 text-sm shadow-sm">
        <div className="flex items-center justify-between rounded-lg bg-black/5 px-3 py-2 font-semibold">
          <span>Pregunta 12 de 40</span>
          <span className="tabular">Tiempo restante 39:58</span>
        </div>
        <p className="mt-3 font-medium">Está permitido en la vía:</p>
        <ol className="mt-2 space-y-1">
          {["a) …", "b) …", "c) …", "d) …"].map((o) => (
            <li key={o} className="rounded-md border border-black/10 px-2 py-1.5">
              {o}
            </li>
          ))}
        </ol>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center font-semibold">
          <span className="rounded-full bg-black/5 py-2">Anterior</span>
          <span className="rounded-full bg-accent py-2 text-white">Siguiente</span>
          <span className="rounded-full bg-correct py-2 text-white">Finalizar</span>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {ITEMS.map((it) => (
          <li key={it.key} className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-sm">
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-semibold">{it.es}</span>
              {lang !== "es" && <span className="block text-sm text-muted">{t(`examUi.items.${it.key}`)}</span>}
            </span>
          </li>
        ))}
      </ul>
      <a href="https://sierdgtt.mtc.gob.pe/" target="_blank" rel="noopener noreferrer" className="mt-6 flex items-center gap-3 rounded-2xl bg-accent-soft p-4 text-sm">
        <Icon name="share" className="h-5 w-5 shrink-0 text-accent" />
        <span>
          <span className="block font-semibold text-accent">{t("examUi.official")}</span>
          <span className="block text-muted">{t("examUi.officialHint")}</span>
        </span>
      </a>
    </AppShell>
  );
}
