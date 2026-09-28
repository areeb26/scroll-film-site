#!/usr/bin/env bash
# Scaffold a new scroll-film client site from the bundled template.
#
# Usage:  new-site.sh <folder> "<Brand Name>" [port]
#   Creates ./<folder> in the current directory, fills in the brand and slug,
#   and (if ./.claude/launch.json exists) adds a python http.server preview
#   entry on the given port or the next free one from 5180.
set -euo pipefail

DIR="${1:?usage: new-site.sh <folder> \"<Brand Name>\" [port]}"
BRAND="${2:?usage: new-site.sh <folder> \"<Brand Name>\" [port]}"
PORT="${3:-}"
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
SLUG="$(basename "$DIR")"

[ -e "$DIR" ] && { echo "✗ $DIR already exists" >&2; exit 1; }
cp -r "$SKILL/assets/template" "$DIR"
mkdir -p "$DIR/assets/img" "$DIR/video"
chmod +x "$DIR"/scripts/*.sh

# Fill tokens in text files.
grep -rlE '\{\{(BRAND|SLUG)\}\}' "$DIR" | while read -r f; do
  python3 - "$f" "$BRAND" "$SLUG" <<'PY'
import sys
p, brand, slug = sys.argv[1:4]
s = open(p, encoding='utf-8').read().replace('{{BRAND}}', brand).replace('{{SLUG}}', slug)
open(p, 'w', encoding='utf-8').write(s)
PY
done

# Preview entry in ./.claude/launch.json (Claude Code preview servers).
if [ -f .claude/launch.json ]; then
  PORT="$(python3 - "$SLUG" "$DIR" "$PORT" <<'PY'
import json, sys
slug, d, want = sys.argv[1], sys.argv[2], sys.argv[3]
p = '.claude/launch.json'
cfg = json.load(open(p))
confs = cfg.setdefault('configurations', [])
used = {c.get('port') for c in confs}
port = int(want) if want else next(x for x in range(5180, 5300) if x not in used)
if not any(c.get('name') == slug for c in confs):
    confs.append({'name': slug, 'runtimeExecutable': 'python3',
                  'runtimeArgs': ['-m', 'http.server', str(port), '--directory', d], 'port': port})
    json.dump(cfg, open(p, 'w'), indent=2); open(p, 'a').write('\n')
else:
    port = next(c['port'] for c in confs if c.get('name') == slug)
print(port)
PY
)"
  echo "✓ Preview entry '$SLUG' on port $PORT in .claude/launch.json"
fi

echo "✓ Scaffolded $DIR for \"$BRAND\""
echo "  Next: photos → assets/img/poster.webp, VEO_PROMPT.md, then build index.html / css / js/data.js"
echo "  Local: python3 -m http.server ${PORT:-5180} --directory \"$DIR\""
