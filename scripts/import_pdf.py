"""Import the MTC balotario PDF into content/<cat>/questions.json + images.

Usage: python scripts/import_pdf.py [--cat a1] [--pdf content/source/A-I.pdf]

The script is deterministic: running it twice on the same PDF produces identical
output. Enrichment fields that are not derivable from the PDF (topic, terms,
anchors, twins) are preserved from the existing questions.json, keyed by id.
Every textual repair applied to the PDF text is written to scripts/fixes.log.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import re
import sys
from pathlib import Path

import pdfplumber
import pymupdf
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OPTION_KEYS = ("a", "b", "c", "d")
ENRICHMENT_KEYS = ("topic", "terms", "anchors", "twins")
LOW_RES_PX = 160

sys.stdout.reconfigure(encoding="utf-8")


class Fixes:
    def __init__(self) -> None:
        self.lines: list[str] = []

    def add(self, qid: str, field: str, kind: str, before: str, after: str) -> None:
        self.lines.append(f"{qid}\t{field}\t{kind}\t{before!r}\t->\t{after!r}")


def normalize_cell(raw: str | None, qid: str, field: str, fixes: Fixes) -> str:
    text = raw or ""
    # Word breaks a line right after a hyphen ("contra-\ncurva", "P-\n59"): the
    # hyphen is part of the source text, only the line break is an artifact.
    for m in re.finditer(r"(\w)-\n(\w)", text):
        fixes.add(qid, field, "hyphen-linebreak", m.group(0), m.group(0).replace("\n", ""))
    text = re.sub(r"(\w)-\n(\w)", r"\1-\2", text)
    text = text.replace("\n", " ")
    text = re.sub(r"\s+", " ", text).strip()

    # Encoding defect of the source .docx: typographic quotes came out as "¿".
    for m in re.finditer(r"¿([^¿?]+?)¿", text):
        fixes.add(qid, field, "quote-encoding", m.group(0), f"«{m.group(1)}»")
    text = re.sub(r"¿([^¿?]+?)¿", r"«\1»", text)
    for m in re.finditer(r"(?<=\bun )¿([A-ZÁÉÍÓÚÑ ]+?)\?", text):
        fixes.add(qid, field, "quote-encoding", m.group(0), f"«{m.group(1)}»")
    text = re.sub(r"(?<=\bun )¿([A-ZÁÉÍÓÚÑ ]+?)\?", r"«\1»", text)
    return text


def strip_option_prefix(text: str, key: str, qid: str) -> str:
    m = re.match(rf"^{key}\)\s*(.*)$", text, flags=re.S)
    if not m:
        raise ValueError(f"{qid}: option {key} does not start with '{key})': {text[:40]!r}")
    return m.group(1).strip()


def detect_answer_type(options: dict[str, str], correct: str) -> str:
    ans = options[correct].lower()
    if re.search(r"ninguna de las (alternativas|anteriores|respuestas)", ans):
        return "none"
    if re.search(r"todas las (anteriores|alternativas|respuestas)", ans):
        return "all"
    if re.search(r"\b[abc]\s*(,|y|e)\s*[abcd]\b.*(correctas|verdaderas)", ans) or re.search(
        r"\b(ambas|las dos)\b.*(correctas|verdaderas)", ans
    ):
        return "combo"
    return "text"


def extract_rows(pdf_path: Path, fixes: Fixes, cat: str) -> list[dict]:
    rows: list[dict] = []
    with pdfplumber.open(str(pdf_path)) as pdf:
        for page_index, page in enumerate(pdf.pages):
            for table in page.find_tables():
                data = table.extract()
                for cells, row_obj in zip(data, table.rows):
                    if not cells[0] or not cells[0].strip().isdigit():
                        continue
                    number = int(cells[0].strip())
                    qid = f"{cat}-{number:03d}"
                    text = normalize_cell(cells[8], qid, "text", fixes)
                    options = {}
                    for key, col in zip(OPTION_KEYS, (9, 10, 11, 12)):
                        options[key] = strip_option_prefix(normalize_cell(cells[col], qid, key, fixes), key, qid)
                    correct = (cells[13] or "").strip().lower()
                    if correct not in OPTION_KEYS:
                        raise ValueError(f"{qid}: bad answer {correct!r}")
                    rows.append(
                        {
                            "id": qid,
                            "number": number,
                            "page": page_index + 1,
                            "bbox": row_obj.bbox,
                            "text": text,
                            "options": options,
                            "correct": correct,
                        }
                    )
    return rows


def pixmap_to_png(doc: pymupdf.Document, xref: int) -> bytes:
    pix = pymupdf.Pixmap(doc, xref)
    if pix.n - pix.alpha >= 4:
        pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
    return pix.tobytes("png")


def extract_images(pdf_path: Path, rows: list[dict], out_dir: Path, cat: str) -> tuple[dict[str, str], list[dict]]:
    """Return {question id: public image path} and a list of low-quality images."""
    out_dir.mkdir(parents=True, exist_ok=True)
    doc = pymupdf.open(str(pdf_path))
    images: dict[str, str] = {}
    todo: list[dict] = []
    for page_index, page in enumerate(doc):
        page_rows = [r for r in rows if r["page"] == page_index + 1]
        for info in page.get_image_info(xrefs=True):
            x0, y0, x1, y1 = info["bbox"]
            owners = [r for r in page_rows if r["bbox"][1] <= y0 <= r["bbox"][3] and r["bbox"][0] <= x0 <= r["bbox"][2]]
            if not owners:
                continue  # header logo etc.
            if len(owners) > 1:
                raise ValueError(f"image on page {page_index + 1} matches several rows")
            row = owners[0]
            if row["id"] in images:
                raise ValueError(f"{row['id']}: more than one image; extend the importer")
            png = pixmap_to_png(doc, info["xref"])
            img = Image.open(io.BytesIO(png)).convert("RGBA")
            rel = f"/images/{cat}/{row['number']:03d}.webp"
            target = out_dir / f"{row['number']:03d}.webp"
            img.save(target, "WEBP", lossless=True, quality=100, method=6)
            images[row["id"]] = rel
            w, h = img.size
            if max(w, h) < LOW_RES_PX:
                todo.append({"id": row["id"], "image": rel, "width": w, "height": h, "reason": "low-res"})
    return images, todo


def load_existing(path: Path) -> dict[str, dict]:
    if not path.exists():
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    return {q["id"]: q for q in data}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cat", default="a1")
    parser.add_argument("--pdf", default="content/source/A-I.pdf")
    args = parser.parse_args()

    cat = args.cat
    pdf_path = ROOT / args.pdf
    out_json = ROOT / "content" / cat / "questions.json"
    images_dir = ROOT / "public" / "images" / cat
    fixes = Fixes()

    sha = hashlib.sha256(pdf_path.read_bytes()).hexdigest()
    rows = extract_rows(pdf_path, fixes, cat)
    rows.sort(key=lambda r: r["number"])
    numbers = [r["number"] for r in rows]
    if numbers != list(range(1, len(rows) + 1)):
        raise ValueError(f"question numbers are not 1..N: missing {sorted(set(range(1, max(numbers) + 1)) - set(numbers))}")

    images, images_todo = extract_images(pdf_path, rows, images_dir, cat)
    existing = load_existing(out_json)

    questions = []
    for r in rows:
        prev = existing.get(r["id"], {})
        q = {
            "id": r["id"],
            "category": cat,
            "number": r["number"],
            "topic": prev.get("topic", "otros"),
            "text": r["text"],
            "options": r["options"],
            "correct": r["correct"],
        }
        if r["id"] in images:
            q["image"] = images[r["id"]]
        q["sourcePage"] = r["page"]
        q["terms"] = prev.get("terms", [])
        q["anchors"] = prev.get("anchors", {"questionKeys": [], "answerKeys": []})
        q["answerType"] = detect_answer_type(r["options"], r["correct"])
        if prev.get("twins"):
            q["twins"] = prev["twins"]
        questions.append(q)

    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_json.write_text(json.dumps(questions, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (ROOT / "content" / cat / "images-todo.json").write_text(
        json.dumps(images_todo, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (ROOT / "scripts" / "fixes.log").write_text(
        f"# source {args.pdf} sha256={sha}\n# id\tfield\tkind\tbefore\t->\tafter\n" + "\n".join(fixes.lines) + "\n",
        encoding="utf-8",
    )

    by_type: dict[str, int] = {}
    for q in questions:
        by_type[q["answerType"]] = by_type.get(q["answerType"], 0) + 1
    print(f"questions: {len(questions)}")
    print(f"with image: {len(images)} (low-res: {len(images_todo)})")
    print(f"fixes logged: {len(fixes.lines)}")
    print(f"answerType: {by_type}")
    print(f"pdf sha256: {sha}")


if __name__ == "__main__":
    main()
