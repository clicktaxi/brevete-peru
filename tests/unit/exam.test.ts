import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { pickExamQuestions, scoreAttempt, type ExamAttempt } from "@/lib/exam";
import type { Question } from "@/lib/types";

const questions: Question[] = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../content/a1/questions.json"), "utf8"));

describe("exam", () => {
  it("picks 40 unique questions deterministically from a seed", () => {
    const a = pickExamQuestions(questions, 40, 123);
    const b = pickExamQuestions(questions, 40, 123);
    expect(a).toHaveLength(40);
    expect(new Set(a.map((q) => q.id)).size).toBe(40);
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id));
    expect(pickExamQuestions(questions, 40, 124).map((q) => q.id)).not.toEqual(a.map((q) => q.id));
  });

  it("passes at 35 correct answers", () => {
    const picked = pickExamQuestions(questions, 40, 7);
    const answers: ExamAttempt["answers"] = {};
    picked.forEach((q, i) => {
      answers[q.id] = i < 35 ? q.correct : q.correct === "a" ? "b" : "a";
    });
    const attempt: ExamAttempt = { id: "x", category: "a1", seed: 7, questionIds: picked.map((q) => q.id), answers, startedAt: 0, timeLimitSec: 2400 };
    const res = scoreAttempt(attempt, new Map(questions.map((q) => [q.id, q])), 35);
    expect(res.score).toBe(35);
    expect(res.passed).toBe(true);
    expect(res.wrong).toHaveLength(5);
    answers[picked[0].id] = picked[0].correct === "a" ? "b" : "a";
    expect(scoreAttempt(attempt, new Map(questions.map((q) => [q.id, q])), 35).passed).toBe(false);
  });
});
