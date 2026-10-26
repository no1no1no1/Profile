#!/usr/bin/env bash
# Store coach secrets in the macOS keychain (service "coach"). Re-run to update.
set -euo pipefail
for name in TELEGRAM_BOT_TOKEN TELEGRAM_CHAT_ID FITBIT_TOKEN NOVIA_METRICS_KEY XAI_API_KEY; do
  read -r -s -p "$name (enter to skip): " val; echo
  [ -n "$val" ] && security add-generic-password -U -s coach -a "$name" -w "$val"
done
echo "Saved. Test: node $(dirname "$0")/../index.js notify test hello"
