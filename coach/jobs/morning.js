import { think } from '../lib/brain.js';
import { notify } from '../lib/notify.js';
import { noviaMetrics, health } from '../lib/sources.js';
import { load, update } from '../lib/state.js';

export default async function morning({ print } = {}) {
  const s = load();
  const ctx = {
    today: new Date().toDateString(),
    health: await health(),
    metrics: await noviaMetrics(),
    wip: s.wip,
    openCommitments: s.commitments.filter((c) => !c.done),
    streaks: s.streaks,
    yesterdayFocus: s.focus,
  };
  const text = await think('morning', ctx);
  if (print) return console.log(text);
  // Save the brief's ONE thing so "Locked in", check-ins and drift checks refer to it.
  const one = text.match(/ONE thing:?\*?:?\s*(.+)/)?.[1]?.replace(/\*/g, '').trim();
  if (one) update((st) => { st.focus = one; });
  await notify(text, { buttons: [['✅ Locked in', 'focus:ok'], ['🔁 Change ONE thing', 'focus:change']] });
}
