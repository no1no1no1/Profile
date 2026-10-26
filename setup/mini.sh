#!/usr/bin/env bash
# Mac mini bootstrap: always-on agent server + coach host. Safe to re-run.
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"

command -v brew >/dev/null || /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install git gh node tmux mosh jq
brew install --cask tailscale || true
command -v claude >/dev/null || npm install -g @anthropic-ai/claude-code

# Never sleep, restart after power loss
sudo pmset -a sleep 0 disksleep 0 displaysleep 10 autorestart 1 womp 1
sudo systemsetup -setremotelogin on 2>/dev/null || true

mkdir -p ~/work ~/.coach ~/.claude ~/bin
# Key the coach uses to reach the MacBook over Tailscale (Telegram /mb)
[ -f ~/.ssh/id_ed25519 ] || ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519
ln -sf "$REPO/bin/agent" ~/bin/agent
ln -sf "$REPO/bin/coach-notify" ~/bin/coach-notify
"$REPO/setup/link-claude.sh"

(cd "$REPO/coach" && npm install --omit=dev)
for p in "$REPO"/coach/launchd/*.plist; do
  dest=~/Library/LaunchAgents/$(basename "$p")
  sed "s#__REPO__#$REPO#g; s#__HOME__#$HOME#g" "$p" > "$dest"
  launchctl unload "$dest" 2>/dev/null || true
  launchctl load "$dest"
done
echo "Done. Next: open Tailscale, run coach/bin/secrets.sh, then: ssh-copy-id macbook"
