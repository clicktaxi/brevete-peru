"use client";

import { useT } from "@/components/providers";

export function Loading({ error }: { error?: string | null }) {
  const t = useT();
  return <p className="rounded-2xl bg-surface p-4 text-center text-muted">{error ?? t("common.loading")}</p>;
}
