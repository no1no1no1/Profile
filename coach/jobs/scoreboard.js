import { notify } from '../lib/notify.js';
import { load } from '../lib/state.js';
import { today } from '../lib/time.js';

// 18:00 daily score: did the ONE thing ship?
export default async function scoreboard() {
  const s = load();
  const due = s.commitments.filter((c) => !c.done && c.due && c.due.slice(0, 10) <= today());
  const { workout = 0, shutdown = 0, shipped = 0 } = s.streaks;
  return notify(
    `🏆 *Scoreboard 18:00*\n🎯 ${s.focus ?? '❓ no ONE thing set'}\n` +
      `📌 Promises due: ${due.length ? due.map((c) => c.what).join(', ') : 'none 🟢'}\n` +
      `🔥 Streaks: shipped ${shipped} · trained ${workout} · shutdown ${shutdown}\n👉 Did the ONE thing ship?`,
    { buttons: [['✅ Shipped', 'score:yes'], ['❌ Not yet', 'score:no']] }
  );
}
