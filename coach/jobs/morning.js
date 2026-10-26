import { think } from '../lib/brain.js';
import { notify } from '../lib/notify.js';
import { noviaMetrics, health } from '../lib/sources.js';
import { load } from '../lib/state.js';

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
  await notify(text, { buttons: [['✅ Locked in', 'focus:ok'], ['🔁 Change ONE thing', 'focus:change']] });
}
