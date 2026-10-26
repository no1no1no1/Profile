import { notify } from '../lib/notify.js';
import { activity } from '../lib/sources.js';
import { load, update } from '../lib/state.js';

// Runs every 30 min: if an agent window has been active for 90+ min with no break, nudge to move.
export default async function body() {
  const busy = activity().windows.some((w) => w.idleMin < 5);
  const now = Date.now();
  const s = load();
  const streakStart = busy ? (s.busySince ?? now) : null;
  update((st) => (st.busySince = streakStart));
  if (streakStart && now - streakStart > 90 * 60_000) {
    await notify('💪 *Move break*\n90 min straight. Agents keep running; you need blood flow.\n👉 Water + 20 pushups + 2 min outside.');
    update((st) => (st.busySince = now));
  }
}
