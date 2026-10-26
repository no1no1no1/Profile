# Install runbook (for Claude Code running on the Mac mini)

You are installing this repo's system on the user's Mac mini. Work step by step, explain each step in one line,
and stop to ask the user only where marked 👤. Never print secret values back.

1. Check: macOS, Apple Silicon, `~/Profile` is this repo (clone `https://github.com/no1no1no1/profile` to `~/Profile` and check out `claude/chief-of-staff` if not).
2. Run `setup/mini.sh`. It needs sudo for `pmset`. 👤 Ask the user to type their password in the terminal when prompted.
3. Tailscale: `open -a Tailscale`. 👤 The user signs in. Confirm with `tailscale status`.
4. Telegram bot: 👤 The user opens @BotFather → `/newbot` → pastes the token when `coach/bin/secrets.sh` asks. Skip the others for now.
5. 👤 The user sends "hi" to the new bot from @noviasolutions. Run `node coach/bin/telegram-pair.js`.
6. Test: `node coach/index.js notify test "hello from the mini"`. The user should get it on the phone.
7. Restart the daemon: `launchctl kickstart -k gui/$(id -u)/solutions.novia.coach.daemon`. 👤 The user sends `/help` and `/local hi` in Telegram.
8. Check `claude` is logged in with the claude.ai account that has the Gmail/Calendar connectors: `claude -p "list my calendar events today"`. If that fails, 👤 the user runs `claude` → `/login`.
9. Test the morning brief: `node coach/index.js run morning --print`.
10. Optional, later: Fitbit token, `NOVIA_METRICS_KEY`, `XAI_API_KEY` via `coach/bin/secrets.sh`. Pair the MacBook (`setup/macbook.sh` there, then `ssh-copy-id macbook` here).
11. Show the logs if anything fails: `tail -50 ~/.coach/*.log`.

Finish with a checklist of what works and what's still pending.
