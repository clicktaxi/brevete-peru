"use client";

import { useEffect, useState } from "react";
import { useHelpLevel } from "@/components/providers";
import { QuestionCard } from "./QuestionCard";
import { getQuestionStats, recordAnswer, toggleStar } from "@/lib/progress";
import type { LogicWord, OptionKey, Question, QuestionTranslation } from "@/lib/types";

/** Interactive question on a static page: answer once, star, record progress. */
export function QuestionIsland({ question, translation, logic }: { question: Question; translation?: QuestionTranslation; logic: LogicWord[] }) {
  const [helpLevel, setHelpLevel] = useHelpLevel();
  const [selected, setSelected] = useState<OptionKey>();
  const [starred, setStarred] = useState(false);

  useEffect(() => {
    getQuestionStats(question.category).then((s) => setStarred(!!s[question.id]?.starred));
  }, [question]);

  return (
    <QuestionCard
      question={question}
      translation={translation}
      logic={logic}
      helpLevel={helpLevel}
      onHelpLevel={setHelpLevel}
      mode="quiz"
      selected={selected}
      onSelect={(k) => {
        setSelected(k);
        void recordAnswer(question.category, question.id, k, k === question.correct, { withHelp: helpLevel < 4 });
      }}
      showAnchors
      starred={starred}
      onStar={() => toggleStar(question.category, question.id).then(setStarred)}
      hideNumber
    />
  );
}
