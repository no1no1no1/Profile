# Agostino Iacone: CTO @ [novia.solutions](https://novia.solutions)

How I work: many Claude Code agents in parallel, steered from my phone, with a proactive coach keeping me (ADHD brain) focused, fit and shipping.

```
 iPhone ──Telegram / Claude app──┐
                                 ▼
 MacBook ──Tailscale + mosh──▶ Mac mini (always on)
  cockpit                       ├─ tmux "agents": 1 worktree + 1 claude per task (WIP ≤ 3)
                                ├─ coach daemon: two-way Telegram, scheduled jobs (launchd)
                                └─ Remote Control: drive any session from the phone
 Sources: Gmail · Calendar · GitHub · Novia KPIs (Apps Script) · Fitbit · Claude transcripts · X via Grok
```

## Daily rhythm (all pushed to iPhone)
| When | What |
|---|---|
| 07:30 | Morning brief: sleep, meetings, KPIs, dues, training slot, the **ONE thing** |
| every 5 min | Meeting in ~10 min → prep note (bypasses quiet hours) |
| hourly | Captures promises from sent mail and nudges when they're due |
| 12:30 | X digest via Grok (optional) |
| 13:00, 16:00 | Drift check: declared focus vs. what git/tmux show |
| 90 min busy | Move/water break |
| 21:00 | Shutdown ritual: win, open loops, tomorrow's ONE thing, trained? |
| 22:30 | Wind-down |
| Sun 18:00 | Weekly review → `reviews/YYYY-WW.md` + proposed rule changes (one tap to apply) |

Quiet hours are 23:30–07:00. Guardrails: email is drafts only, no merges/deploys, no spending.

## Setup
1. **Mac mini:** `git clone` this repo to `~/Profile`, run `setup/mini.sh`, then `coach/bin/secrets.sh`.
2. **Telegram:** message @BotFather → `/newbot` → token. Send the bot a message, then read `chat.id` from `https://api.telegram.org/bot<token>/getUpdates`.
3. **Fitbit:** create an app at dev.fitbit.com (personal, scopes: sleep, activity, heartrate) and store the access token.
4. **Novia KPIs:** make the Apps Script web app return JSON. If it needs auth, have it check a `?key=` param (`NOVIA_METRICS_KEY`).
5. **Claude:** run `claude` once on the mini and log in with the claude.ai account that has the Gmail/Calendar/GitHub connectors. Turn on Remote Control.
6. **MacBook:** `setup/macbook.sh`, then `mini` attaches to the agent server.
7. **iPhone:** install Tailscale, Telegram and the Claude app, with notifications on.

## Daily use
```bash
agent new ~/work/novia-app "add stripe webhook retries"   # worktree + tmux + claude, blocked if WIP is full
agent ls
coach focus "ship onboarding v2"
coach run morning --print                                 # test any job
```
Inside Claude: `/ship`, `/park`, `/review-pr 123`, `/morning`.

## Layout
`setup/` bootstrap · `claude/` global CLAUDE.md, settings, hooks, skills · `bin/` agent + hook notifier · `coach/` daemon, jobs, prompts, rules, launchd · `reviews/` weekly memos
