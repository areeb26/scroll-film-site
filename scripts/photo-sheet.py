#!/usr/bin/env python3
"""Contact sheet of every image in a folder, each tile labelled
"<index> <file stem> <w>x<h in hundreds of px>", so photos can be chosen by eye.

Usage: photo-sheet.py <folder> <out.jpg> [--tile 260] [--cols 6]
Needs Pillow (pip install pillow).
"""
import argparse
import glob
import os

from PIL import Image, ImageDraw, ImageOps

ap = argparse.ArgumentParser()
ap.add_argument('folder')
ap.add_argument('out')
ap.add_argument('--tile', type=int, default=260)
ap.add_argument('--cols', type=int, default=6)
a = ap.parse_args()

files = sorted(f for ext in ('jpg', 'jpeg', 'png', 'webp') for f in glob.glob(os.path.join(a.folder, f'*.{ext}')))
if not files:
    raise SystemExit(f'no images in {a.folder}')
T, cols = a.tile, a.cols
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (T * cols, T * rows), 'white')
draw = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    try:
        im = Image.open(f).convert('RGB')
    except Exception:
        print('unreadable:', f)
        continue
    x, y = (i % cols) * T, (i // cols) * T
    sheet.paste(ImageOps.fit(im, (T, T)), (x, y))
    label = f'{i} {os.path.splitext(os.path.basename(f))[0][:14]} {im.width // 100}x{im.height // 100}'
    draw.rectangle([x, y, x + 7 * len(label) + 4, y + 15], fill='black')
    draw.text((x + 3, y + 2), label, fill='yellow')
sheet.save(a.out, quality=80)
print(f'✓ {a.out}: {len(files)} images')
