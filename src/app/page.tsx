import { LANG_NAMES } from "@/lib/i18n";
import { LANGS } from "@/lib/types";

const redirectScript = `(function(){var l=(navigator.language||'').slice(0,2);var s=['ru','en','es'];try{var p=localStorage.getItem('lang');if(p&&s.indexOf(p)>=0)l=p;}catch(e){}if(s.indexOf(l)<0)l='es';location.replace('/'+l+'/');})();`;

export default function Root() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <script dangerouslySetInnerHTML={{ __html: redirectScript }} />
      <h1 className="text-2xl font-bold">Brevete Perú</h1>
      <ul className="flex gap-3">
        {LANGS.map((l) => (
          <li key={l}>
            <a href={`/${l}/`} className="rounded-full bg-accent px-4 py-2 font-semibold text-white" hrefLang={l}>
              {LANG_NAMES[l]}
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
