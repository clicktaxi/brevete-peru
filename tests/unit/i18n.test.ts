import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { interpolate, lookup, switchLangPath } from "@/lib/i18n";

const ROOT = path.resolve(__dirname, "../..");
const flat = (o: Record<string, unknown>, p = ""): string[] =>
  Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? flat(v as Record<string, unknown>, `${p}${k}.`) : [`${p}${k}`]));
const dict = (lang: string) => JSON.parse(fs.readFileSync(path.join(ROOT, "messages", `${lang}.json`), "utf8"));

describe("i18n", () => {
  it("all dictionaries have the same keys", () => {
    const ru = flat(dict("ru")).sort();
    expect(flat(dict("en")).sort()).toEqual(ru);
    expect(flat(dict("es")).sort()).toEqual(ru);
  });

  it("every t('key') used in src exists in ru.json", () => {
    const ru = dict("ru");
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.tsx?$/.test(e.name)) files.push(p);
      }
    };
    walk(path.join(ROOT, "src"));
    const missing = new Set<string>();
    for (const f of files) {
      const src = fs.readFileSync(f, "utf8");
      for (const m of src.matchAll(/\bt\(\s*"([a-zA-Z0-9_.]+)"/g)) if (lookup(ru, m[1]) === undefined) missing.add(m[1]);
    }
    expect([...missing]).toEqual([]);
  });

  it("interpolates and switches language paths", () => {
    expect(interpolate("{a} of {b}", { a: 1, b: 2 })).toBe("1 of 2");
    expect(switchLangPath("/ru/a1/practice/", "en")).toBe("/en/a1/practice/");
    expect(switchLangPath("/", "es")).toBe("/es/");
  });
});
