import { think } from '../lib/brain.js';
import { notify } from '../lib/notify.js';
import { update, load } from '../lib/state.js';
import { isQuiet } from '../lib/time.js';

// Hourly: scan sent mail for promises ("I'll send...", "by Friday") and nudge on ones coming due.
export default async function commitments() {
  if (isQuiet()) return; // sent mail can wait until morning
  const s = load();
  const raw = await think('commitments', { known: s.commitments, now: new Date().toISOString() }, { model: 'haiku' });
  let found = [];
  try { found = JSON.parse(raw.slice(raw.indexOf('['), raw.lastIndexOf(']') + 1)); } catch { return; }
  const added = update((st) => {
    const keys = new Set(st.commitments.map((c) => c.what));
    const fresh = found.filter((c) => c.what && !keys.has(c.what)).map((c) => ({ ...c, done: false, added: new Date().toISOString() }));
    st.commitments.push(...fresh);
    return fresh;
  });
  for (const c of added) await notify(`📌 Captured promise: *${c.what}*${c.to ? ` → ${c.to}` : ''}${c.due ? ` (due ${c.due})` : ''}`);
  const soon = load().commitments.filter((c) => !c.done && c.due && new Date(c.due) - Date.now() < 24 * 3600_000);
  if (soon.length) await notify(`⚠️ Due within 24h:\n${soon.map((c) => `• ${c.what}`).join('\n')}`);
}
