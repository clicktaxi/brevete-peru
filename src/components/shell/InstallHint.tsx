"use client";

import { useEffect, useState } from "react";
import { useT } from "@/components/providers";
import { Icon } from "@/components/ui/Icon";

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const DISMISS_KEY = "installHintDismissed";

export function InstallHint() {
  const t = useT();
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (standalone || dismissed) return;
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setShow(true);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mt-4 flex items-start gap-3 rounded-2xl bg-accent-soft p-4 text-sm">
      <Icon name="download" className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{t("install.title")}</p>
        <p className="text-muted">{ios ? t("install.ios") : deferred ? t("install.android") : t("install.generic")}</p>
        {deferred && (
          <button
            type="button"
            onClick={async () => {
              await deferred.prompt();
              const { outcome } = await deferred.userChoice;
              if (outcome === "accepted") dismiss();
            }}
            className="mt-2 h-10 rounded-full bg-accent px-4 font-semibold text-white"
          >
            {t("install.button")}
          </button>
        )}
      </div>
      <button type="button" onClick={dismiss} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-black/5" aria-label={t("common.close")}>
        <Icon name="x" className="h-4 w-4" />
      </button>
    </div>
  );
}
