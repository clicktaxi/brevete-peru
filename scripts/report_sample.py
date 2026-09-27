"""Print a Markdown sample of N random questions with translation, gloss and anchors for manual review.

Usage: python scripts/report_sample.py [--cat a1] [--n 10] [--seed 1] > docs/stage1-sample.md
"""

from __future__ import annotations

import argparse
import json
import random
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.stdout.reconfigure(encoding="utf-8")


def gloss_line(chunks: list[dict]) -> str:
    parts = []
    for c in chunks:
        mark = {"logic": "⚠", "anchor": "★"}.get(c.get("kind"), "")
        parts.append(f"**{c['es']}**{mark} _{c['tr']}_")
    return " · ".join(parts)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--cat", default="a1")
    p.add_argument("--n", type=int, default=10)
    p.add_argument("--seed", type=int, default=1)
    a = p.parse_args()
    cat = ROOT / "content" / a.cat
    qs = json.loads((cat / "questions.json").read_text(encoding="utf-8"))
    ru = {t["id"]: t for t in json.loads((cat / "i18n" / "ru.json").read_text(encoding="utf-8"))}
    en = {t["id"]: t for t in json.loads((cat / "i18n" / "en.json").read_text(encoding="utf-8"))}
    rng = random.Random(a.seed)
    sample = sorted(rng.sample(qs, a.n), key=lambda q: q["number"])
    print(f"# Выборка {a.n} вопросов {a.cat.upper()} для проверки (seed={a.seed})\n")
    for q in sample:
        r, e = ru[q["id"]], en[q["id"]]
        print(f"## {q['number']}. {q['text']}\n")
        if q.get("image"):
            print(f"![{q['id']}](../public{q['image']})\n")
        print(f"- Тема: `{q['topic']}` · Тип ответа: `{q['answerType']}` · PDF стр. {q['sourcePage']}")
        print(f"- Якоря вопроса: {', '.join(q['anchors']['questionKeys'])}")
        print(f"- Якоря ответа: {', '.join(q['anchors']['answerKeys']) or '— (нет, см. trap)'}")
        print(f"- Термины: {', '.join(q['terms'])}")
        if q.get("twins"):
            print(f"- Двойники: {', '.join(q['twins'])}")
        print()
        for k in "abcd":
            mark = " ✅" if k == q["correct"] else ""
            print(f"- **{k})** {q['options'][k]}{mark}  \n  RU: {r['options'][k]}  \n  EN: {e['options'][k]}")
        print(f"\n**RU:** {r['text']}  \n**EN:** {e['text']}\n")
        print(f"**Gist:** {r['gist']} / {e['gist']}\n")
        print(f"**Объяснение (RU):** {r['explanation']}\n")
        print(f"**Explanation (EN):** {e['explanation']}\n")
        if r.get("trap"):
            print(f"**Ловушка (RU):** {r['trap']}\n")
        if r.get("legalRef"):
            print(f"**Норма:** {r['legalRef']}\n")
        print("**Подстрочник (RU):**\n")
        print(f"- Вопрос: {gloss_line(r['gloss']['text'])}")
        for k in "abcd":
            print(f"- {k}) {gloss_line(r['gloss']['options'][k])}")
        print()


if __name__ == "__main__":
    main()
