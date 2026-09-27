"use client";

import { useEffect } from "react";
import { useLang } from "@/components/providers";
import { requestPersistentStorage } from "@/lib/progress";

export function ServiceWorker() {
  const lang = useLang();
  useEffect(() => {
    requestPersistentStorage();
    try {
      localStorage.setItem("lang", lang);
    } catch {
      /* ignore */
    }
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, [lang]);
  return null;
}

/** Ask the service worker to cache everything a category needs offline. */
export function precacheCategory(urls: string[]) {
  navigator.serviceWorker?.controller?.postMessage({ type: "PRECACHE", urls });
}
