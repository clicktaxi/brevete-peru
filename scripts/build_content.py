"""Merge content/<cat>/parts/batch-*.json into questions.json (topic, terms, anchors, twins),
content/<cat>/i18n/{ru,en}.json and content/<cat>/disputed.json.

Usage: python scripts/build_content.py [--cat a1]
Deterministic: same inputs -> identical outputs.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from itertools import combinations
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OPTION_KEYS = ("a", "b", "c", "d")
LANGS = ("ru", "en")
TWIN_TEXT_JACCARD = 0.5
TWIN_SHARED_OPTIONS = 2
MAX_TWINS = 3
STOPWORDS = set(
    "de la el los las un una unos unas y o a en que se al del por para con su sus es son está están como lo le si"
    " qué cuál cual cuando donde ante sobre siguiente señal vertical reglamentaria indica significa le".split()
)
sys.stdout.reconfigure(encoding="utf-8")


def fold(s: str) -> str:
    s = unicodedata.normalize("NFD", s.lower())
    return "".join(ch for ch in s if unicodedata.category(ch) != "Mn")


FOLDED_STOPWORDS = {fold(w) for w in STOPWORDS}


def tokens(s: str) -> set[str]:
    # Sign codes like "r-30f" stay whole so that sign questions are not all twins of each other.
    return {t for t in re.findall(r"[a-z]-[0-9]+[a-z]?(?:-[0-9a-z]+)?|[a-z0-9]+", fold(s)) if t not in FOLDED_STOPWORDS and len(t) > 2}


def compute_twins(questions: list[dict]) -> dict[str, list[str]]:
    scored: dict[str, list[tuple[float, str]]] = {q["id"]: [] for q in questions}
    for q1, q2 in combinations(questions, 2):
        if fold(q1["options"][q1["correct"]]) == fold(q2["options"][q2["correct"]]) and fold(q1["text"]) == fold(q2["text"]):
            continue
        t1, t2 = tokens(q1["text"]), tokens(q2["text"])
        jac = len(t1 & t2) / len(t1 | t2) if len(t1 | t2) >= 4 else 0.0
        o1 = {fold(v) for v in q1["options"].values()}
        o2 = {fold(v) for v in q2["options"].values()}
        shared_opts = len(o1 & o2 - {fold("Ninguna de las alternativas es correcta"), fold("Ninguna de las alternativas es correcta.")})
        if jac >= TWIN_TEXT_JACCARD or shared_opts >= TWIN_SHARED_OPTIONS:
            score = jac + 0.25 * shared_opts
            scored[q1["id"]].append((score, q2["id"]))
            scored[q2["id"]].append((score, q1["id"]))
    result: dict[str, list[str]] = {}
    for qid, lst in scored.items():
        lst.sort(key=lambda x: (-x[0], x[1]))
        if lst:
            result[qid] = [t for _, t in lst[:MAX_TWINS]]
    return result


def stem(word: str) -> str:
    w = fold(word)
    for suffix in ("ces", "es", "s"):
        if w.endswith(suffix) and len(w) - len(suffix) >= 3:
            return w[: -len(suffix)] + ("z" if suffix == "ces" else "")
    return w


def stem_key(phrase: str) -> str:
    return " ".join(stem(w) for w in re.findall(r"[\wáéíóúüñ]+", phrase.lower()))


class TermResolver:
    def __init__(self, terms: list[dict]) -> None:
        self.exact: dict[str, str] = {}
        self.stemmed: dict[str, str] = {}
        for t in terms:
            variants = [t["es"], t["id"].replace("-", " "), *t.get("forms", [])]
            for v in variants:
                self.exact.setdefault(fold(v), t["id"])
                self.stemmed.setdefault(stem_key(v), t["id"])

    def resolve(self, lemma: str) -> list[str]:
        hit = self.exact.get(fold(lemma)) or self.stemmed.get(stem_key(lemma))
        if hit:
            return [hit]
        # Compound lemma ("disminuir la velocidad"): link every glossary word inside it.
        found: list[str] = []
        for w in re.findall(r"[\wáéíóúüñ]+", lemma.lower()):
            tid = self.exact.get(fold(w)) or self.stemmed.get(stem_key(w))
            if tid and tid not in found:
                found.append(tid)
        return found


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cat", default="a1")
    args = parser.parse_args()
    cat_dir = ROOT / "content" / args.cat

    questions = json.loads((cat_dir / "questions.json").read_text(encoding="utf-8"))
    glossary = json.loads((ROOT / "content" / "glossary" / "terms.json").read_text(encoding="utf-8"))
    resolver = TermResolver(glossary)

    meta: dict[str, dict] = {}
    translations: dict[str, dict[str, dict]] = {lang: {} for lang in LANGS}
    disputed: list[dict] = []
    for part in sorted((cat_dir / "parts").glob("batch-*.json")):
        batch = json.loads(part.read_text(encoding="utf-8"))
        meta.update(batch.get("meta", {}))
        for lang in LANGS:
            translations[lang].update(batch.get(lang, {}))
        disputed.extend(batch.get("disputed", []))

    unresolved: dict[str, list[str]] = {}
    for q in questions:
        m = meta.get(q["id"])
        if not m:
            print(f"WARN {q['id']}: no meta in parts")
            continue
        q["topic"] = m["topic"]
        ids: list[str] = []
        for lemma in m.get("terms", []):
            hits = resolver.resolve(lemma)
            if not hits:
                unresolved.setdefault(lemma, []).append(q["id"])
            for tid in hits:
                if tid not in ids:
                    ids.append(tid)
        q["terms"] = ids
        q["anchors"] = {
            "questionKeys": list(m["anchors"]["questionKeys"]),
            "answerKeys": list(m["anchors"]["answerKeys"]),
        }

    twins = compute_twins(questions)
    for q in questions:
        if q["id"] in twins:
            q["twins"] = twins[q["id"]]
        else:
            q.pop("twins", None)

    (cat_dir / "questions.json").write_text(json.dumps(questions, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for lang in LANGS:
        items = [translations[lang][q["id"]] for q in questions if q["id"] in translations[lang]]
        (cat_dir / "i18n" / f"{lang}.json").write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    disputed.sort(key=lambda d: d["id"])
    (cat_dir / "disputed.json").write_text(json.dumps(disputed, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (cat_dir / "terms-unresolved.json").write_text(
        json.dumps(dict(sorted(unresolved.items())), ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    topics: dict[str, int] = {}
    for q in questions:
        topics[q["topic"]] = topics.get(q["topic"], 0) + 1
    no_anchor = [q["id"] for q in questions if not q["anchors"]["answerKeys"]]
    print(f"questions: {len(questions)}; translations ru={len(translations['ru'])} en={len(translations['en'])}")
    print(f"topics: {dict(sorted(topics.items(), key=lambda kv: -kv[1]))}")
    print(f"questions without answerKeys: {len(no_anchor)}")
    print(f"questions with twins: {len(twins)}; pairs: {sum(len(v) for v in twins.values()) // 2}")
    print(f"unresolved glossary terms: {len(unresolved)} (see content/{args.cat}/terms-unresolved.json)")
    print(f"disputed: {len(disputed)}")


if __name__ == "__main__":
    main()
