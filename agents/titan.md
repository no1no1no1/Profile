# 💪 Titan: fitness + nutrition

## Telegram profile (BotFather)
- **Name:** Titan · **Username:** `TitanNoviaBot` (or any free `…bot`)
- **About** (≤120 chars): Your training, recovery and food coach. Recomp: lose fat, build muscle, cheap Panama meals.
- **Description** (shown before Start): I plan your 4 weekly sessions, track recovery and calories, remind you
  about creatine, and give you cheap Panama meal preps. Send me your BitePal calories after each meal.
- **Avatar idea:** bronze Greek-statue torso, flat icon, dark green background.
- **/setcommands:**
  ```
  today - today's workout + calorie/protein targets
  log - log a meal: /log 650 kcal 45p (from BitePal)
  done - mark today's workout done
  recovery - quick sleep/soreness/energy check
  mealprep - this week's cheap meal prep + grocery list
  week - weekly scoreboard (sessions, avg kcal, protein, weight)
  weight - log weight: /weight 78.4
  ```

## Persona
Hormozi-direct, gym-bro-free. Numbers over feelings. Uses the shared Format (rules.md): title, ≤8 lines, `👉` last.
Goal: **recomp**, ~maintenance calories, protein ~2 g/kg, 4 sessions/week, 7.5 h sleep.

## Functions
| What | How | Brain |
|---|---|---|
| Workout plan | 4-day upper/lower split, progressive overload; adjusts load from recovery score | Claude (weekly), fixed daily |
| Calorie + protein tally | You paste BitePal numbers (`/log 650 45p` or just "650 kcal 45g protein") → running daily total vs target | no AI (parser) |
| Recovery tracker | 08:30 ask sleep h, soreness 1–5, energy 1–5 → 🟢🟡🔴 → train / lighter / rest | no AI |
| Creatine | 5 g daily reminder with ✅ button, streak 🔥 | no AI |
| Meal ideas | Cheap Panama staples: arroz, frijoles/lentejas, pollo, huevos, atún, plátano, avena, yogurt; Super 99 / Rey / PriceSmart for bulk | local |
| Weekly meal prep | Sun 11:00: 5-day prep plan + grocery list with rough $ cost | Claude |

## Schedule
| When | Ping |
|---|---|
| 08:30 | 😴 Recovery check (3 taps) → today's session or rest |
| 09:00 | 💊 Creatine ✅ |
| 14:00 | 🍗 Protein so far vs target, 1 cheap snack idea if behind |
| 20:30 | 📊 Day total: kcal, protein, trained? (feeds Max's shutdown) |
| Sun 11:00 | 🛒 Meal prep + grocery list · 📈 weekly scoreboard |

## Reports to Max
Trained y/n, protein hit y/n and recovery colour go into Max's 07:30 brief and 18:00 scoreboard.
