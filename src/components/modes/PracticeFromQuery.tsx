"use client";

import { useSearchParams } from "next/navigation";
import { PracticeMode } from "./PracticeMode";

export function PracticeFromQuery({ cat }: { cat: string }) {
  const params = useSearchParams();
  return <PracticeMode cat={cat} initialTopic={params.get("topic") ?? ""} />;
}
