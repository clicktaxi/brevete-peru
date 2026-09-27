import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { I18nProvider, SettingsProvider } from "@/components/providers";
import { ServiceWorker } from "@/components/shell/ServiceWorker";
import { getDict } from "@/lib/dictionaries";
import { isLang } from "@/lib/i18n";
import { LANGS } from "@/lib/types";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const dict = getDict(lang);
  const app = dict.app as Record<string, string>;
  return { title: { default: app.name, template: `%s · ${app.name}` }, description: app.tagline };
}

export default async function LangLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <I18nProvider lang={lang} dict={getDict(lang)}>
      <SettingsProvider lang={lang}>
        {children}
        <ServiceWorker />
      </SettingsProvider>
    </I18nProvider>
  );
}
