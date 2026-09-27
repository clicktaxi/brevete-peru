"""Check a content batch file (content/<cat>/parts/batch-NN.json) against questions.json.

Usage: python scripts/check_part.py content/a1/parts/batch-01.json [--from 1 --to 20]

Batch file format:
{
  "meta": { "<question id>": { "topic": "senales", "terms": ["berma", ...], "anchors": {"questionKeys": [...], "answerKeys": [...]} } },
  "ru":   { "<question id>": QuestionTranslation },
  "en":   { "<question id>": QuestionTranslation }
}
Exit code 1 if there is at least one error.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OPTION_KEYS = ("a", "b", "c", "d")
sys.stdout.reconfigure(encoding="utf-8")


def fold(s: str) -> str:
    s = unicodedata.normalize("NFD", s.lower())
    return "".join(ch for ch in s if unicodedata.category(ch) != "Mn")


def word_count(s: str) -> int:
    return len([w for w in re.split(r"\s+", s.strip()) if w])


def sentences(s: str) -> list[str]:
    return [p.strip() for p in re.split(r"(?<=[.!?])\s+", s.strip()) if p.strip()]


def check_gloss(original: str, chunks: list[dict], where: str, errors: list[str]) -> None:
    pos = 0
    for i, ch in enumerate(chunks):
        es = ch.get("es", "")
        if not es or not es.strip():
            errors.append(f"{where}: chunk {i} has empty es")
            return
        if not isinstance(ch.get("tr"), str) or not ch["tr"].strip():
            errors.append(f"{where}: chunk {i} ({es!r}) has empty tr")
        while pos < len(original) and original[pos] == " ":
            pos += 1
        if not original.startswith(es, pos):
            errors.append(f"{where}: chunk {i} {es!r} does not match original at {pos}: {original[pos:pos + 40]!r}")
            return
        pos += len(es)
        if ch.get("kind") not in (None, "logic", "anchor"):
            errors.append(f"{where}: chunk {i} bad kind {ch.get('kind')!r}")
    rest = original[pos:].strip()
    if rest:
        errors.append(f"{where}: gloss chunks stop before the end of the text; remaining {rest[:40]!r}")


def check_translation(q: dict, tr: dict, lang: str, errors: list[str]) -> None:
    where = f"{q['id']} [{lang}]"
    if tr.get("id") != q["id"]:
        errors.append(f"{where}: id mismatch {tr.get('id')!r}")
    for field in ("text", "gist", "explanation"):
        if not isinstance(tr.get(field), str) or not tr[field].strip():
            errors.append(f"{where}: {field} is empty")
    opts = tr.get("options") or {}
    for k in OPTION_KEYS:
        if not isinstance(opts.get(k), str) or not opts[k].strip():
            errors.append(f"{where}: options.{k} is empty")
    if tr.get("status") not in ("machine", "reviewed", "approved"):
        errors.append(f"{where}: bad status {tr.get('status')!r}")
    if tr.get("gist") and word_count(tr["gist"]) > 7:
        errors.append(f"{where}: gist has {word_count(tr['gist'])} words (max 7): {tr['gist']!r}")
    if tr.get("explanation"):
        for s in sentences(tr["explanation"]):
            if word_count(s) > 15:
                errors.append(f"{where}: explanation sentence has {word_count(s)} words (max 15): {s!r}")
        if len(sentences(tr["explanation"])) > 4:
            errors.append(f"{where}: explanation has more than 4 sentences")
    if q["anchors"]["answerKeys"] == [] and not (tr.get("trap") or "").strip():
        errors.append(f"{where}: no answerKeys and no trap — one of them is required")
    gloss = tr.get("gloss") or {}
    if not isinstance(gloss.get("text"), list):
        errors.append(f"{where}: gloss.text missing")
    else:
        check_gloss(q["text"], gloss["text"], f"{where} gloss.text", errors)
    gopts = gloss.get("options") or {}
    for k in OPTION_KEYS:
        if not isinstance(gopts.get(k), list):
            errors.append(f"{where}: gloss.options.{k} missing")
            continue
        check_gloss(q["options"][k], gopts[k], f"{where} gloss.options.{k}", errors)
        has_anchor_kind = any(ch.get("kind") == "anchor" for ch in gopts[k])
        if has_anchor_kind and k != q["correct"]:
            errors.append(f"{where}: gloss.options.{k} marks an anchor but the correct option is {q['correct']}")


def check_meta(q: dict, meta: dict, topics: set[str], errors: list[str]) -> None:
    where = f"{q['id']} [meta]"
    if meta.get("topic") not in topics:
        errors.append(f"{where}: unknown topic {meta.get('topic')!r}")
    if not isinstance(meta.get("terms"), list):
        errors.append(f"{where}: terms must be a list")
    anchors = meta.get("anchors") or {}
    qk = anchors.get("questionKeys")
    ak = anchors.get("answerKeys")
    if not isinstance(qk, list) or not (1 <= len(qk) <= 4):
        errors.append(f"{where}: questionKeys must have 1..4 entries")
    else:
        for k in qk:
            if fold(k) not in fold(q["text"]):
                errors.append(f"{where}: questionKey {k!r} not found in question text")
    if not isinstance(ak, list) or len(ak) > 3:
        errors.append(f"{where}: answerKeys must be a list of 0..3 entries")
    else:
        correct = fold(q["options"][q["correct"]])
        for k in ak:
            if fold(k) not in correct:
                errors.append(f"{where}: answerKey {k!r} not found in the correct option")
            for o in OPTION_KEYS:
                if o != q["correct"] and fold(k) in fold(q["options"][o]):
                    errors.append(f"{where}: answerKey {k!r} also appears in wrong option {o}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("files", nargs="+")
    parser.add_argument("--cat", default="a1")
    parser.add_argument("--from", dest="start", type=int)
    parser.add_argument("--to", dest="end", type=int)
    args = parser.parse_args()

    questions = {q["id"]: q for q in json.loads((ROOT / "content" / args.cat / "questions.json").read_text(encoding="utf-8"))}
    topics = {t["id"] for t in json.loads((ROOT / "content" / "topics.json").read_text(encoding="utf-8"))}
    errors: list[str] = []
    for file in args.files:
        path = Path(file)
        try:
            batch = json.loads(path.read_text(encoding="utf-8"))
        except Exception as e:  # noqa: BLE001
            print(f"{file}: invalid JSON: {e}")
            return 1
        meta = batch.get("meta") or {}
        ids = set(meta) | set(batch.get("ru") or {}) | set(batch.get("en") or {})
        if args.start and args.end:
            expected = {f"{args.cat}-{n:03d}" for n in range(args.start, args.end + 1)}
            for missing in sorted(expected - ids):
                errors.append(f"{missing}: missing from batch")
            for extra in sorted(ids - expected):
                errors.append(f"{extra}: not in range {args.start}..{args.end}")
            ids = expected & ids
        for qid in sorted(ids):
            q = questions.get(qid)
            if not q:
                errors.append(f"{qid}: unknown question id")
                continue
            m = meta.get(qid)
            if not m:
                errors.append(f"{qid}: missing meta")
            else:
                q = {**q, "anchors": m.get("anchors") or {"questionKeys": [], "answerKeys": []}}
                check_meta(q, m, topics, errors)
            for lang in ("ru", "en"):
                tr = (batch.get(lang) or {}).get(qid)
                if not tr:
                    errors.append(f"{qid}: missing {lang} translation")
                else:
                    check_translation(q, tr, lang, errors)
    for e in errors:
        print("ERROR", e)
    print(f"{'OK' if not errors else 'FAILED'}: {len(errors)} error(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
