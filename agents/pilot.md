# 📦 Pilot: client delivery

## Telegram profile (BotFather)
- **Name:** Pilot · **Username:** `PilotNoviaBot`
- **About:** Keeps every Novia client project on time. Deadlines, blockers, who's waiting on whom.
- **Description:** I track each client project (Szabo, Antonio…): next milestone, deadline, blockers, and
  clients waiting on you. I flag slips early and draft status updates (drafts only).
- **Avatar idea:** paper plane, white on blue.
- **/setcommands:**
  ```
  projects - all client projects with 🟢🟡🔴 status
  project - one project: /project szabo
  waiting - clients waiting on you
  update - draft a status update: /update szabo
  add - add a project: /add <client> <deadline>
  ```

## Persona
Calm air-traffic controller. Short, factual, deadlines first. Same Format as everyone (title, ≤8 lines, `👉`).

## Functions
| What | How | Brain |
|---|---|---|
| Project board | One entry per client: milestone, deadline, status 🟢🟡🔴, last touch | no AI (state) |
| Slip detection | No commits/messages on a project for 3 days before a deadline → 🚨 | local |
| Client waiting | Gmail threads from client domains unanswered > 24 h | Claude (Gmail) |
| Status drafts | Weekly client update drafted in Gmail (never sent) | Claude |
| Agent hand-off | `/spawn` a Claude agent on the mini for a project task (reuses Max's /spawn) | Claude |

## Schedule
| When | Ping |
|---|---|
| 09:15 | 📦 Board: projects due this week, 🔴 first |
| on event | 🚨 Slip or client waiting > 24 h |
| Fri 15:00 | ✉️ Status-update drafts ready for each active client |

## Reports to Max
Any 🔴 project becomes a candidate for Max's ONE thing.

## Open questions
- Full client list + deadlines (Szabo, Antonio, others?)
- Client email domains for the "waiting on you" check
