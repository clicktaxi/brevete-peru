import fs from "node:fs";
import path from "node:path";
import {
  CategorySchema,
  ExamFormulaSchema,
  GlossaryTermSchema,
  LogicWordSchema,
  OPTION_KEYS,
  QuestionSchema,
  QuestionTranslationSchema,
  TopicSchema,
  type GlossChunk,
  type Question,
  type QuestionTranslation,
} from "../src/lib/types";

const ROOT = path.resolve(__dirname, "..");
const TRANSLATION_LANGS = ["ru", "en"] as const;
const errors: string[] = [];
const err = (msg: string) => errors.push(msg);

const readJson = (rel: string) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean);
const sentences = (s: string) =>
  s
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);

function checkGloss(original: string, chunks: GlossChunk[], where: string) {
  let pos = 0;
  for (const [i, ch] of chunks.entries()) {
    while (pos < original.length && original[pos] === " ") pos++;
    if (!original.startsWith(ch.es, pos)) {
      err(`${where}: chunk ${i} ${JSON.stringify(ch.es)} does not match original at ${pos}`);
      return;
    }
    pos += ch.es.length;
    if (!ch.tr.trim()) err(`${where}: chunk ${i} has empty translation`);
  }
  if (original.slice(pos).trim()) err(`${where}: gloss does not cover the end of the text`);
}

function validateCategory(catId: string) {
  const questions: Question[] = readJson(`content/${catId}/questions.json`);
  const topics = new Set<string>(readJson("content/topics.json").map((t: { id: string }) => t.id));
  const glossary = new Set<string>(readJson("content/glossary/terms.json").map((t: { id: string }) => t.id));
  const category = readJson("content/categories.json").find((c: { id: string }) => c.id === catId);
  if (!category) err(`${catId}: not in categories.json`);

  for (const [i, q] of questions.entries()) {
    const parsed = QuestionSchema.safeParse(q);
    if (!parsed.success) err(`${catId}[${i}]: schema: ${parsed.error.issues.map((x) => x.path.join(".") + " " + x.message).join("; ")}`);
  }
  const ids = new Set(questions.map((q) => q.id));
  const numbers = questions.map((q) => q.number).sort((a, b) => a - b);
  if (numbers.length !== 200) err(`${catId}: expected 200 questions, got ${numbers.length}`);
  numbers.forEach((n, i) => {
    if (n !== i + 1) err(`${catId}: question numbering broken at index ${i} (number ${n})`);
  });

  let withImage = 0;
  let noAnchorNoTrap = 0;
  let noAnchor = 0;
  const byTopic: Record<string, number> = {};
  const translations: Record<string, Map<string, QuestionTranslation>> = {};
  for (const lang of TRANSLATION_LANGS) {
    const list: QuestionTranslation[] = readJson(`content/${catId}/i18n/${lang}.json`);
    translations[lang] = new Map(list.map((t) => [t.id, t]));
    for (const t of list) {
      const parsed = QuestionTranslationSchema.safeParse(t);
      if (!parsed.success) err(`${t.id} [${lang}]: schema: ${parsed.error.issues.map((x) => x.path.join(".") + " " + x.message).join("; ")}`);
      if (!ids.has(t.id)) err(`${t.id} [${lang}]: translation for unknown question`);
    }
  }

  for (const q of questions) {
    byTopic[q.topic] = (byTopic[q.topic] ?? 0) + 1;
    if (!topics.has(q.topic)) err(`${q.id}: unknown topic ${q.topic}`);
    for (const k of OPTION_KEYS) if (!q.options[k].trim()) err(`${q.id}: option ${k} is empty`);
    if (q.image) {
      withImage++;
      if (!fs.existsSync(path.join(ROOT, "public", q.image))) err(`${q.id}: image ${q.image} not found`);
    }
    for (const t of q.terms) if (!glossary.has(t)) err(`${q.id}: term ${t} not in glossary`);
    for (const t of q.twins ?? []) {
      if (!ids.has(t)) err(`${q.id}: twin ${t} does not exist`);
      if (t === q.id) err(`${q.id}: is its own twin`);
    }
    const correct = fold(q.options[q.correct]);
    for (const key of q.anchors.answerKeys) {
      if (!correct.includes(fold(key))) err(`${q.id}: answerKey ${JSON.stringify(key)} missing from correct option`);
      for (const k of OPTION_KEYS) {
        if (k !== q.correct && fold(q.options[k]).includes(fold(key))) err(`${q.id}: answerKey ${JSON.stringify(key)} also in wrong option ${k}`);
      }
    }
    for (const key of q.anchors.questionKeys) {
      if (!fold(q.text).includes(fold(key))) err(`${q.id}: questionKey ${JSON.stringify(key)} missing from question text`);
    }
    if (q.anchors.answerKeys.length === 0) noAnchor++;

    for (const lang of TRANSLATION_LANGS) {
      const t = translations[lang].get(q.id);
      const where = `${q.id} [${lang}]`;
      if (!t) {
        err(`${where}: missing translation`);
        continue;
      }
      if (words(t.gist).length > 7) err(`${where}: gist longer than 7 words`);
      for (const s of sentences(t.explanation)) if (words(s).length > 15) err(`${where}: explanation sentence longer than 15 words: ${s}`);
      if (q.anchors.answerKeys.length === 0 && !t.trap?.trim()) {
        err(`${where}: no answerKeys and no trap`);
      }
      checkGloss(q.text, t.gloss.text, `${where} gloss.text`);
      for (const k of OPTION_KEYS) {
        checkGloss(q.options[k], t.gloss.options[k], `${where} gloss.options.${k}`);
        if (k !== q.correct && t.gloss.options[k].some((c) => c.kind === "anchor")) err(`${where}: anchor mark on wrong option ${k}`);
      }
    }
    if (q.anchors.answerKeys.length === 0 && !TRANSLATION_LANGS.every((l) => translations[l].get(q.id)?.trap?.trim())) noAnchorNoTrap++;
  }

  console.log(`[${catId}] questions: ${questions.length}, with image: ${withImage}`);
  console.log(`[${catId}] topics: ${JSON.stringify(byTopic)}`);
  console.log(`[${catId}] without answerKeys: ${noAnchor}; without answerKeys AND trap: ${noAnchorNoTrap}`);
  console.log(`[${catId}] with twins: ${questions.filter((q) => q.twins?.length).length}`);
  const anchoredShare = (questions.length - noAnchorNoTrap) / questions.length;
  if (anchoredShare < 0.9) err(`${catId}: only ${(anchoredShare * 100).toFixed(1)}% of questions have an anchor or trap (need >= 90%)`);
}

function validateShared() {
  for (const c of readJson("content/categories.json")) {
    const p = CategorySchema.safeParse(c);
    if (!p.success) err(`categories.json ${c.id}: ${p.error.message}`);
    if (!fs.existsSync(path.join(ROOT, c.sourcePdf))) err(`categories.json ${c.id}: sourcePdf missing`);
  }
  for (const t of readJson("content/topics.json")) {
    const p = TopicSchema.safeParse(t);
    if (!p.success) err(`topics.json ${t.id}: ${p.error.message}`);
  }
  const terms = readJson("content/glossary/terms.json");
  const seen = new Set<string>();
  for (const t of terms) {
    const p = GlossaryTermSchema.safeParse(t);
    if (!p.success) err(`terms.json ${t.id}: ${p.error.message}`);
    if (seen.has(t.id)) err(`terms.json: duplicate id ${t.id}`);
    seen.add(t.id);
  }
  if (terms.length < 150) err(`terms.json: only ${terms.length} terms (need >= 150)`);
  for (const w of readJson("content/glossary/logic.json")) {
    const p = LogicWordSchema.safeParse(w);
    if (!p.success) err(`logic.json ${w.es}: ${p.error.message}`);
  }
  for (const f of readJson("content/glossary/formulas.json")) {
    const p = ExamFormulaSchema.safeParse(f);
    if (!p.success) err(`formulas.json ${f.id}: ${p.error.message}`);
  }
  console.log(`glossary: ${terms.length} terms`);
}

validateShared();
for (const c of readJson("content/categories.json")) validateCategory(c.id);

if (errors.length) {
  for (const e of errors) console.error("ERROR " + e);
  console.error(`FAILED: ${errors.length} error(s)`);
  process.exit(1);
}
console.log("OK: content is valid");
