"""Generate Open Graph images (1200x630) for every question: public/og/<cat>/NNN.png + public/og/default.png.

Usage: python scripts/build_og.py [--cat a1]
Deterministic: same content -> identical PNGs.
"""

from __future__ import annotations

import argparse
import json
import sys
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
W, H = 1200, 630
NAVY = (20, 30, 48)
NAVY_MID = (53, 87, 125)
WHITE = (255, 255, 255)
MUTED = (170, 186, 210)
sys.stdout.reconfigure(encoding="utf-8")


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    for name in (["segoeuib.ttf", "arialbd.ttf"] if bold else ["segoeui.ttf", "arial.ttf"]):
        try:
            return ImageFont.truetype(f"C:/Windows/Fonts/{name}", size)
        except OSError:
            continue
    for name in ["DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"]:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def background() -> Image.Image:
    img = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(img)
    for x in range(0, W, 4):
        f = x / W
        d.rectangle([x, 0, x + 4, H], fill=tuple(int(NAVY[i] + (NAVY_MID[i] - NAVY[i]) * f) for i in range(3)))
    return img


def save(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.convert("P", palette=Image.Palette.ADAPTIVE, colors=64).save(path, "PNG", optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cat", default="a1")
    args = parser.parse_args()
    cat = args.cat
    category = next(c for c in json.loads((ROOT / "content" / "categories.json").read_text(encoding="utf-8")) if c["id"] == cat)
    questions = json.loads((ROOT / "content" / cat / "questions.json").read_text(encoding="utf-8"))
    base = background()
    big, med, small, brand = font(44, True), font(36), font(26), font(30, True)

    d = ImageDraw.Draw(base)
    d.rounded_rectangle([60, 60, 120, 120], radius=14, fill=WHITE)
    d.text((90, 90), "B", font=brand, fill=NAVY, anchor="mm")
    d.text((140, 90), "Brevete Perú", font=brand, fill=WHITE, anchor="lm")
    d.text((W - 60, 90), f"Balotario MTC · {category['code']}", font=small, fill=MUTED, anchor="rm")

    default = base.copy()
    dd = ImageDraw.Draw(default)
    dd.text((60, 300), "Examen de conocimientos MTC", font=big, fill=WHITE, anchor="lm")
    dd.text((60, 370), "Preparación gratuita, con traducción y explicaciones", font=med, fill=MUTED, anchor="lm")
    save(default, ROOT / "public" / "og" / "default.png")

    for q in questions:
        img = base.copy()
        d = ImageDraw.Draw(img)
        d.text((60, 190), f"Pregunta {q['number']}", font=small, fill=MUTED, anchor="lm")
        lines = textwrap.wrap(q["text"], width=48)[:4]
        if len(textwrap.wrap(q["text"], width=48)) > 4:
            lines[-1] = lines[-1][:45].rstrip() + "…"
        y = 240
        for line in lines:
            d.text((60, y), line, font=big, fill=WHITE, anchor="lm")
            y += 60
        d.text((60, H - 70), "a · b · c · d — ¿cuál es la correcta?", font=small, fill=MUTED, anchor="lm")
        save(img, ROOT / "public" / "og" / cat / f"{q['number']:03d}.png")
    print(f"og images: {len(questions)} + default")


if __name__ == "__main__":
    main()
