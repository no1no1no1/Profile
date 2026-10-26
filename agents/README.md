# Agent roster (draft)

Each agent = one Telegram bot (own name, avatar, chat) sharing the coach engine on the Mac mini:
same `rules.md` Format + guardrails, its own persona, prompts, schedule and state.
Max stays the boss: others report into his 07:30 brief and 18:00 scoreboard.

## Proposed agents
| | Agent | Role | Key functions | Brain | Pings/day |
|---|---|---|---|---|---|
| 🧠 | **Max** (live) | Chief of staff | ONE thing, check-ins, drift, promises, shutdown, weekly review | Claude + local | 6–8 |
| 💪 | **Titan** | Fitness + nutrition | 4x/wk recomp plan, recovery tracker, BitePal calorie tally, creatine reminder, cheap Panama meal prep | Claude + local | 3–5 |
| 💰 | **Hunter** | Novia sales | Leads from JARVIS scraper, follow-up reminders, outreach drafts (drafts only), pipeline scoreboard | Claude (Gmail) | 2–3 |
| 🛠 | **Forge** | CTO / eng ops | PRs waiting, failing CI, Vercel deploy errors, agent status on mini/MacBook | local + GitHub/Vercel | on event |
| 📦 | **Pilot** | Client delivery | Status per client project (Szabo store, Antonio site…), deadlines, "client waiting on you" | Claude | 1–2 |
| 📣 | **Echo** | Content + brand | X digest, post ideas from what you shipped, draft posts, posting streak | Claude / Grok | 1 |
| 📊 | **Ledger** | Money | Weekly spend/runway, unpaid invoices, subscription creep (read-only) | Claude | weekly |
| 🏠 | **Home** | Life admin | Birthdays, calls home, errands, bills, appointments | local | 0–2 |

**Chosen:** Max (live) + [Titan](titan.md) + [Hunter](hunter.md) + [Pilot](pilot.md), as separate bots. Build Titan first, then Hunter, then Pilot; one per week, once the previous one earns its pings.

## Limits
- **Bots:** Telegram allows ~20 bots per account (BotFather). Bots can't message you until you press Start,
  can't read each other's messages, and are limited to ~1 msg/sec per chat (irrelevant at this volume).
- **Real limit = your attention.** Beyond ~25 pings/day across all bots, everything gets muted. Max gates the others.
- **Mac mini (8 GB):** one local model (qwen3:4b) at a time; local replies queue. Claude jobs run in parallel fine.
- **Claude:** `claude -p` runs on your claude.ai plan, so it uses plan limits, not a per-token bill.
  Heavy connector jobs (Gmail/Calendar) are what eat the limit.

## Cost (orders of magnitude, API-equivalent)
| Call type | Tokens per call | Example |
|---|---|---|
| Fixed message (check-in, scoreboard) | 0 | no AI |
| Local reply (Ollama) | ~1–3k | free, just slower |
| Claude chat reply | ~3–5k | ~$0.01–0.03 |
| Claude + Gmail/Calendar (morning brief) | ~20–60k | ~$0.10–0.30 |
| Meal photo (vision) | ~2–5k | ~$0.01–0.02 |
| Weekly review (reads transcripts) | ~100–300k | ~$0.50–2 |

- Light agent (Home, Ledger): ~10–30k tokens/day, about cents per day.
- Medium agent (Titan, Hunter): ~50–150k/day, ~$0.20–1/day.
- Heavy (Max with connectors): ~200–500k/day, ~$1–3/day.
- All 8 agents: ~1M tokens/day, ~$3–8/day API-equivalent. On a Max plan that's inside the limits if heavy jobs stay ≤ hourly.
