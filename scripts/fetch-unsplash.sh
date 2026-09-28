#!/usr/bin/env bash
# Download free Unsplash photos by ID (the <ID> in unsplash.com/photos/<ID>/download).
#
# Usage:  fetch-unsplash.sh <dir> <id> [id ...]
#   WIDTH=2000 fetch-unsplash.sh …   to change the size (default 1600 px wide)
# Files land as <dir>/<id>.jpg; anything that isn't an image (premium/removed) is deleted.
set -uo pipefail

DIR="${1:?usage: fetch-unsplash.sh <dir> <id> [id ...]}"; shift
W="${WIDTH:-1600}"
mkdir -p "$DIR"

for id in "$@"; do
  [ -s "$DIR/$id.jpg" ] && continue
  curl -sL --max-time 60 -o "$DIR/$id.jpg" "https://unsplash.com/photos/$id/download?w=$W" &
done
wait

ok=0; bad=0
for id in "$@"; do
  f="$DIR/$id.jpg"
  if [ -s "$f" ] && file -b --mime-type "$f" | grep -q '^image/'; then ok=$((ok + 1)); else rm -f "$f"; bad=$((bad + 1)); echo "  ✗ $id (not an image)"; fi
done
[ "$bad" -gt 0 ] && echo "✓ $ok photos in $DIR ($bad failed)" || echo "✓ $ok photos in $DIR"
