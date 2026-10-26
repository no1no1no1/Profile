#!/usr/bin/env bash
# MacBook cockpit: same tools + quick jump to the mini. Safe to re-run.
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
command -v brew >/dev/null || /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install git gh node tmux mosh jq
brew install --cask tailscale || true
command -v claude >/dev/null || npm install -g @anthropic-ai/claude-code
mkdir -p ~/bin && ln -sf "$REPO/bin/coach-notify" ~/bin/coach-notify
"$REPO/setup/link-claude.sh"
# Let the mini reach this MacBook so Telegram /mb works
sudo systemsetup -setremotelogin on 2>/dev/null || true

grep -q "alias mini=" ~/.zshrc 2>/dev/null || cat >> ~/.zshrc <<'Z'
# Jump into the agent server (Tailscale hostname "mini")
alias mini='mosh mini -- tmux new -A -s main'
Z
echo "Done. 'mini' attaches to the Mac mini tmux session."
echo "Name this Mac 'macbook' in Tailscale, then on the mini run: ssh-copy-id macbook"
