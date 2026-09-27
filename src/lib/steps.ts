export type StepId = "words" | "understand" | "recognize" | "exam";
export const STEP_IDS: StepId[] = ["words", "understand", "recognize", "exam"];
export const STEP_THRESHOLD: Record<StepId, number> = { words: 1, understand: 0.8, recognize: 0.8, exam: 0.9 };
export const STEP_WINDOW = 20;
