import { z } from "zod";

export const LANGS = ["es", "ru", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const LangSchema = z.enum(LANGS);

export const OPTION_KEYS = ["a", "b", "c", "d"] as const;
export type OptionKey = (typeof OPTION_KEYS)[number];
export const OptionKeySchema = z.enum(OPTION_KEYS);

export const CATEGORY_IDS = ["a1", "a2a", "a2b", "a3a", "a3b", "a3c", "b2a", "b2b", "b2c"] as const;
export type CategoryId = (typeof CATEGORY_IDS)[number];

const LangRecord = z.object({ es: z.string(), ru: z.string(), en: z.string() });

export const CategorySchema = z.object({
  id: z.enum(CATEGORY_IDS),
  code: z.string(),
  examQuestions: z.number().int().positive(),
  passScore: z.number().int().positive(),
  timeLimitSec: z.number().int().positive(),
  sourcePdf: z.string(),
  sourceUrl: z.string().url(),
  sourceVersion: z.string(),
  title: LangRecord,
  description: LangRecord,
});
export type Category = z.infer<typeof CategorySchema>;

export const TopicSchema = z.object({
  id: z.string(),
  order: z.number().int(),
  title: LangRecord,
});
export type Topic = z.infer<typeof TopicSchema>;

export const QuestionAnchorsSchema = z.object({
  questionKeys: z.array(z.string()),
  answerKeys: z.array(z.string()),
});
export type QuestionAnchors = z.infer<typeof QuestionAnchorsSchema>;

export const ANSWER_TYPES = ["text", "combo", "none", "all"] as const;
export type AnswerType = (typeof ANSWER_TYPES)[number];

export const OptionsSchema = z.object({ a: z.string(), b: z.string(), c: z.string(), d: z.string() });

export const QuestionSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+-\d{3}$/),
  category: z.enum(CATEGORY_IDS),
  number: z.number().int().positive(),
  topic: z.string(),
  text: z.string().min(1),
  options: OptionsSchema,
  correct: OptionKeySchema,
  image: z.string().optional(),
  sourcePage: z.number().int().positive(),
  terms: z.array(z.string()),
  anchors: QuestionAnchorsSchema,
  answerType: z.enum(ANSWER_TYPES),
  twins: z.array(z.string()).optional(),
});
export type Question = z.infer<typeof QuestionSchema>;

export const GlossChunkSchema = z.object({
  es: z.string().min(1),
  tr: z.string(),
  kind: z.enum(["logic", "anchor"]).optional(),
});
export type GlossChunk = z.infer<typeof GlossChunkSchema>;

export const TRANSLATION_STATUSES = ["machine", "reviewed", "approved"] as const;

export const QuestionTranslationSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  options: OptionsSchema,
  gist: z.string().min(1),
  explanation: z.string().min(1),
  trap: z.string().optional(),
  legalRef: z.string().optional(),
  gloss: z.object({
    text: z.array(GlossChunkSchema).min(1),
    options: z.object({
      a: z.array(GlossChunkSchema).min(1),
      b: z.array(GlossChunkSchema).min(1),
      c: z.array(GlossChunkSchema).min(1),
      d: z.array(GlossChunkSchema).min(1),
    }),
  }),
  status: z.enum(TRANSLATION_STATUSES),
});
export type QuestionTranslation = z.infer<typeof QuestionTranslationSchema>;

const PartialLangRecord = z.object({ es: z.string().optional(), ru: z.string().optional(), en: z.string().optional() });

export const GlossaryTermSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  es: z.string().min(1),
  tr: PartialLangRecord,
  note: PartialLangRecord.optional(),
  example: z.string().optional(),
  image: z.string().optional(),
  topics: z.array(z.string()).optional(),
});
export type GlossaryTerm = z.infer<typeof GlossaryTermSchema>;

export const LogicWordSchema = z.object({
  es: z.string().min(1),
  tr: PartialLangRecord,
  note: PartialLangRecord.optional(),
  opposite: z.string().optional(),
});
export type LogicWord = z.infer<typeof LogicWordSchema>;

export const ExamFormulaSchema = z.object({
  id: z.string(),
  es: z.string().min(1),
  kind: z.enum(["question", "option"]),
  tr: PartialLangRecord,
  note: PartialLangRecord,
});
export type ExamFormula = z.infer<typeof ExamFormulaSchema>;
