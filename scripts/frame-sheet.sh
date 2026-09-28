#!/usr/bin/env bash
# Gridded contact sheet of the hero film, for timing chapters and mobileFocus.
#
# Usage:  frame-sheet.sh video.mp4 out.jpg [fps]
#   fps defaults to 2 (one tile per 0.5 s). Tiles run left→right, top→bottom,
#   4 per row. Yellow lines mark every 10 % of the frame width, red every 50 %
#   (the centre line) — read the subject's x position (0–1) straight off them.
set -euo pipefail

VIDEO="${1:?usage: frame-sheet.sh video.mp4 out.jpg [fps]}"
OUT="${2:?usage: frame-sheet.sh video.mp4 out.jpg [fps]}"
FPS="${3:-2}"

DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$VIDEO")
N=$(python3 -c "import math; print(max(1, math.floor(float('$DUR') * $FPS + 1e-6)))")
ROWS=$(( (N + 3) / 4 ))

ffmpeg -v error -y -i "$VIDEO" -vf "fps=${FPS},scale=400:-2,\
drawgrid=w=iw/10:h=ih:t=1:c=yellow@0.55,drawgrid=w=iw/2:h=ih:t=2:c=red@0.9,\
tile=4x${ROWS}:padding=4:color=white" -frames:v 1 "$OUT"

echo "✓ $OUT — $N tiles, ${DUR%.*}s film, 4 per row"
python3 - "$DUR" "$FPS" "$N" <<'PY'
import sys
dur, fps, n = float(sys.argv[1]), float(sys.argv[2]), int(sys.argv[3])
print('tile  row col   time    scroll progress')
for i in range(n):
    t = i / fps
    t = min(t, dur)
    print(f'{i:>4}  {i // 4:>3} {i % 4:>3}  {t:5.2f}s   {t / dur:.2f}')
PY
