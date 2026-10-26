#!/usr/bin/env bash
# Symlink the shared Claude Code config into ~/.claude
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p ~/.claude/skills
ln -sf "$REPO/claude/CLAUDE.md" ~/.claude/CLAUDE.md
[ -f ~/.claude/settings.json ] && [ ! -L ~/.claude/settings.json ] && mv ~/.claude/settings.json ~/.claude/settings.json.bak
ln -sf "$REPO/claude/settings.json" ~/.claude/settings.json
for s in "$REPO"/claude/skills/*; do ln -sfn "$s" ~/.claude/skills/"$(basename "$s")"; done
