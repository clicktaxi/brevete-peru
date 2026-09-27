import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { QuestionSchema, type Question } from "@/lib/types";

const questions: Question[] = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../../content/a1/questions.json"), "utf8"),
);

describe("content/a1/questions.json", () => {
  it("has 200 questions numbered 1..200", () => {
    expect(questions).toHaveLength(200);
    expect(questions.map((q) => q.number)).toEqual(Array.from({ length: 200 }, (_, i) => i + 1));
  });

  it("matches the Question schema", () => {
    for (const q of questions) expect(QuestionSchema.safeParse(q).success, q.id).toBe(true);
  });

  it("keeps the first question verbatim from the PDF", () => {
    const q = questions[0];
    expect(q.text).toBe("Está permitido en la vía:");
    expect(q.options.c).toBe("Recoger o dejar pasajeros en lugares autorizados.");
    expect(q.correct).toBe("c");
  });
});
