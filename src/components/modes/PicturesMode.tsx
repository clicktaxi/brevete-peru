"use client";

import { useMemo, useState } from "react";
import { useT } from "@/components/providers";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { useCategoryData } from "@/components/quiz/useCategoryData";
import { Loading } from "@/components/ui/Loading";
import { randomSeed, shuffleWithSeed } from "@/lib/text";
import type { Question } from "@/lib/types";

const GROUPS = ["R", "P", "I"] as const;

function signGroup(q: Question): string | null {
  const m = q.text.match(/\b([RPI])-\d/);
  return m ? m[1] : null;
}

export function PicturesMode({ cat }: { cat: string }) {
  const t = useT();
  const { data, glossary, error } = useCategoryData(cat);
  const [group, setGroup] = useState("");
  const [seed, setSeed] = useState(() => randomSeed());
  const questions = useMemo(() => {
    if (!data) return [];
    const list = data.questions.filter((q) => q.image && (!group || signGroup(q) === group));
    return shuffleWithSeed(list, seed);
  }, [data, group, seed]);

  if (error || !data || !glossary) return <Loading error={error} />;

  const pictureOnly = questions.map((q) => ({ ...q, text: "" }));

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{t("pictures.intro")}</p>
      <div className="flex gap-2">
        {["", ...GROUPS].map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => {
              setGroup(g);
              setSeed(randomSeed());
            }}
            className={`h-10 flex-1 rounded-full text-sm font-semibold ${group === g ? "bg-accent text-white" : "bg-black/5"}`}
          >
            {g || t("pictures.allGroups")}
          </button>
        ))}
      </div>
      <QuizRunner key={`${group}-${seed}`} cat={cat} questions={pictureOnly} translations={data.translations} logic={glossary.logic} forcedLevel={4} showAnchors />
    </div>
  );
}
