#!/usr/bin/env python3
"""Regenerate derived images (requires Python 3 + Pillow: `pip install pillow`).

  python3 scripts/images.py sketches "#e5d0b5"
      Composite the transparent sketches (assets/sketch-*.webp) onto the arch colour, with
      firmer lines and livelier washes -> assets/sketch-*-stone.webp. Pass the value of
      --color-stone from src/input.css whenever that colour changes.

  python3 scripts/images.py glow assets/new-project.webp [...]
      Tiny pre-blurred thumbnail for the ambient light behind a project photo
      -> assets/glow/new-project.webp (then set `glow:` for that project in content.js).
"""
import os
import sys

from PIL import Image, ImageEnhance, ImageFilter

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets")


def sketches(stone):
    rgb_bg = tuple(int(stone.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4))
    for name in ("sketch-philosophy", "sketch-vision"):
        im = Image.open(os.path.join(ROOT, name + ".webp")).convert("RGBA")
        r, g, b, a = im.split()
        a = a.point(lambda v: round(255 * (v / 255) ** 0.78))  # faint strokes read stronger
        rgb = Image.merge("RGB", (r, g, b)).point(lambda v: round(255 * (v / 255) ** 1.12))
        rgb = ImageEnhance.Color(rgb).enhance(1.3)
        out = Image.new("RGB", im.size, rgb_bg)
        out.paste(rgb, (0, 0), a)
        dst = os.path.join(ROOT, name + "-stone.webp")
        out.save(dst, "WEBP", quality=80, method=6)
        print(dst)


def glow(paths):
    os.makedirs(os.path.join(ROOT, "glow"), exist_ok=True)
    for path in paths:
        im = Image.open(path).convert("RGB")
        im = im.resize((48, round(48 * im.height / im.width)), Image.LANCZOS)
        im = ImageEnhance.Color(im).enhance(1.4)
        pad = Image.new("RGB", (im.width + 16, im.height + 16), im.resize((1, 1)).getpixel((0, 0)))
        pad.paste(im, (8, 8))
        dst = os.path.join(ROOT, "glow", os.path.splitext(os.path.basename(path))[0] + ".webp")
        pad.filter(ImageFilter.GaussianBlur(4)).save(dst, "WEBP", quality=60, method=6)
        print(dst)


if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "sketches":
        sketches(sys.argv[2])
    elif len(sys.argv) >= 3 and sys.argv[1] == "glow":
        glow(sys.argv[2:])
    else:
        sys.exit(__doc__)
