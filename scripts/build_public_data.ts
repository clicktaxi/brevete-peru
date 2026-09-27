/* Generates the static JSON consumed by client-side modes (fetched, cached by the service worker). */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const read = (rel: string) => JSON.parse(fs.readFileSync(path.join(ROOT, "content", rel), "utf8"));
const out = path.join(ROOT, "public", "data");
fs.mkdirSync(out, { recursive: true });

const categories = read("categories.json");
const topics = read("topics.json");
const langs = ["es", "ru", "en"];

for (const category of categories) {
  const questions = read(`${category.id}/questions.json`);
  for (const lang of langs) {
    const file = path.join(ROOT, "content", category.id, "i18n", `${lang}.json`);
    const translations: Record<string, unknown> = {};
    if (lang !== "es" && fs.existsSync(file)) {
      for (const t of JSON.parse(fs.readFileSync(file, "utf8"))) translations[t.id] = t;
    }
    const data = { category, topics, questions, translations };
    fs.writeFileSync(path.join(out, `${category.id}.${lang}.json`), JSON.stringify(data));
  }
  fs.writeFileSync(path.join(out, `${category.id}.json`), JSON.stringify({ category, topics, questions }));

  // Open data dump: the whole bank with all translations, for anyone to reuse.
  const api = path.join(ROOT, "public", "api");
  fs.mkdirSync(api, { recursive: true });
  const i18n: Record<string, unknown[]> = {};
  for (const lang of langs) {
    const file = path.join(ROOT, "content", category.id, "i18n", `${lang}.json`);
    if (fs.existsSync(file)) i18n[lang] = JSON.parse(fs.readFileSync(file, "utf8"));
  }
  fs.writeFileSync(
    path.join(api, `${category.id}.json`),
    JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), license: "Questions: MTC Perú (public). Translations: CC BY 4.0", category, topics, questions, i18n }, null, 0),
  );
}

fs.writeFileSync(
  path.join(out, "glossary.json"),
  JSON.stringify({ terms: read("glossary/terms.json"), logic: read("glossary/logic.json"), formulas: read("glossary/formulas.json") }),
);
console.log(`public/data written for ${categories.length} categor${categories.length === 1 ? "y" : "ies"}`);
