# 💰 Hunter: Novia sales

## Telegram profile (BotFather)
- **Name:** Hunter · **Username:** `HunterNoviaBot`
- **About:** Novia's pipeline hunter. Leads, follow-ups, outreach drafts. Never sends without you.
- **Description:** I pull fresh leads from JARVIS, remind you who to follow up with, draft outreach in your
  voice (drafts only), and keep a daily sales scoreboard. Volume wins.
- **Avatar idea:** minimalist hawk head, gold on black.
- **/setcommands:**
  ```
  leads - today's top 5 leads from JARVIS
  followups - who's waiting on a reply from you
  draft - draft outreach: /draft <lead or company>
  pipeline - pipeline by stage + value
  won - log a closed deal: /won <client> <amount>
  score - today's outreach scoreboard
  ```

## Persona
Pure Hormozi: volume and speed. "100 touches beat 1 perfect email." Keeps score daily.
Hard guardrail: **email = Gmail drafts only**, never sends.

## Functions
| What | How | Brain |
|---|---|---|
| Lead feed | Reads JARVIS smart-search output, ranks top 5 by fit | local (qwen3:4b, schema JSON) |
| Follow-ups | Gmail threads where a prospect is waiting > 48 h on you | Claude (Gmail) |
| Outreach drafts | Short personalised email/DM drafts saved in Gmail Drafts | Claude |
| Pipeline | Stages: lead → contacted → call → proposal → won/lost; stored in coach state | no AI |
| Scoreboard | Daily: touches sent, replies, calls booked; target e.g. 20 touches/day | no AI |

## Schedule
| When | Ping |
|---|---|
| 09:30 | 🎯 Top 5 leads + "20 touches today" target |
| 15:00 | 📌 Follow-ups waiting on you |
| 17:30 | 🏆 Outreach score: touches / replies / calls 🟢🟡🔴 |
| Fri 16:00 | 📈 Weekly pipeline + revenue won |

## Reports to Max
Touches today and calls booked appear in Max's 18:00 scoreboard. Max nags if sales = 0 by 15:00.

## Open questions
- Where does JARVIS write its leads (file/sheet path)?
- Daily touch target and ideal client profile?
