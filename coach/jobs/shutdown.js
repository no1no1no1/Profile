import { notify } from '../lib/notify.js';
import { load } from '../lib/state.js';

export default async function shutdown() {
  const s = load();
  await notify(
    `🌙 *Shutdown ritual*\nFocus today: ${s.focus ?? '—'}\nWIP: ${s.wip.map((w) => w.slug).join(', ') || 'none'}\n\n` +
      `Reply with:\n1. One win\n2. Open loops (I'll capture them)\n3. Tomorrow's ONE thing\n4. Trained today? (y/n)`
  );
}
