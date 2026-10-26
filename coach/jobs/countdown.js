import { think } from '../lib/brain.js';
import { notify } from '../lib/notify.js';
import { load, update } from '../lib/state.js';

// Runs every 5 min. The brain checks Calendar for meetings starting in 8-15 min and writes a prep note.
export default async function countdown() {
  const s = load();
  const text = await think('countdown', { now: new Date().toISOString(), alreadyPinged: s.pingedEvents ?? [] }, { timeoutMs: 120_000 });
  if (!text || text.startsWith('NONE')) return;
  const [idLine, ...rest] = text.split('\n');
  const id = idLine.replace(/^EVENT:\s*/, '').trim();
  update((st) => (st.pingedEvents = [...(st.pingedEvents ?? []), id].slice(-50)));
  await notify(`⏰ ${rest.join('\n')}`, { urgent: true });
}
