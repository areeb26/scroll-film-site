#!/usr/bin/env python3
"""Resize (and optionally crop) a photo to WebP for the site.

Usage:
  to-webp.py SRC DEST --w 1920 [--q 74]                         # keep aspect, max width
  to-webp.py SRC DEST --w 800 --crop 4:3 [--fx 0.5] [--fy 0.55]  # fixed-ratio crop around a focal point

--fx/--fy are the focal point (0 = left/top, 1 = right/bottom) used when cropping.
Needs Pillow (pip install pillow).
"""
import argparse
import os

from PIL import Image, ImageOps

ap = argparse.ArgumentParser()
ap.add_argument('src')
ap.add_argument('dest')
ap.add_argument('--w', type=int, required=True, help='output width in px')
ap.add_argument('--crop', help='aspect ratio W:H, e.g. 4:3 or 16:9')
ap.add_argument('--fx', type=float, default=0.5)
ap.add_argument('--fy', type=float, default=0.5)
ap.add_argument('--q', type=int, default=72)
a = ap.parse_args()

im = Image.open(a.src).convert('RGB')
if a.crop:
    rw, rh = (float(x) for x in a.crop.split(':'))
    w = min(a.w, im.width)
    im = ImageOps.fit(im, (w, round(w * rh / rw)), Image.LANCZOS, centering=(a.fx, a.fy))
elif im.width > a.w:
    im = im.resize((a.w, round(im.height * a.w / im.width)), Image.LANCZOS)

os.makedirs(os.path.dirname(os.path.abspath(a.dest)), exist_ok=True)
im.save(a.dest, 'WEBP', quality=a.q, method=6)
print(f'✓ {a.dest} {im.width}x{im.height} {os.path.getsize(a.dest) // 1024} KB')
