import { mulberry32 } from "./text";
import type { OptionKey, Question } from "./types";

export function pickExamQuestions(questions: Question[], count: number, seed: number): Question[] {
  const rng = mulberry32(seed);
  const pool = [...questions].sort((a, b) => a.number - b.number);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

export interface ExamAttempt {
  id: string;
  category: string;
  seed: number;
  questionIds: string[];
  answers: Record<string, OptionKey>;
  startedAt: number;
  finishedAt?: number;
  timeLimitSec: number;
  score?: number;
  passed?: boolean;
}

export function scoreAttempt(attempt: ExamAttempt, byId: Map<string, Question>, passScore: number) {
  let score = 0;
  const wrong: string[] = [];
  const byTopic: Record<string, { total: number; correct: number }> = {};
  for (const id of attempt.questionIds) {
    const q = byId.get(id);
    if (!q) continue;
    const t = (byTopic[q.topic] ??= { total: 0, correct: 0 });
    t.total++;
    if (attempt.answers[id] === q.correct) {
      score++;
      t.correct++;
    } else wrong.push(id);
  }
  return { score, passed: score >= passScore, wrong, byTopic };
}

export function remainingSeconds(attempt: ExamAttempt, now = Date.now()): number {
  return Math.max(0, attempt.timeLimitSec - Math.floor((now - attempt.startedAt) / 1000));
}
