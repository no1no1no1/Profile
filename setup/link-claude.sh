#!/usr/bin/env bash
# Adds this repo's Claude config to ~/.claude WITHOUT overwriting what's there. Safe to re-run.
#  - CLAUDE.md: appends the repo rules between markers (replaced on re-run); your content is kept
#  - settings.json: merges permissions + hooks; everything else untouched; backup saved
#  - skills: symlinked (existing skills with the same name are left alone)
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p ~/.claude/skills
MD=~/.claude/CLAUDE.md
[ -L "$MD" ] && { cp "$(readlink "$MD")" "$MD.tmp"; rm "$MD"; mv "$MD.tmp" "$MD"; }
touch "$MD"
cp "$MD" "$MD.bak-$(date +%s)"
sed -i '' '/<!-- chief-of-staff:start -->/,/<!-- chief-of-staff:end -->/d' "$MD" 2>/dev/null \
  || sed -i '/<!-- chief-of-staff:start -->/,/<!-- chief-of-staff:end -->/d' "$MD"
{ echo; echo "<!-- chief-of-staff:start -->"; cat "$REPO/claude/CLAUDE.md"; echo "<!-- chief-of-staff:end -->"; } >> "$MD"
node "$REPO/setup/merge-claude-settings.js" "$REPO/claude/settings.json" ~/.claude/settings.json
for s in "$REPO"/claude/skills/*; do
  dest=~/.claude/skills/"$(basename "$s")"
  [ -e "$dest" ] && [ ! -L "$dest" ] && { echo "skip skill $(basename "$s") (exists)"; continue; }
  ln -sfn "$s" "$dest"
done
