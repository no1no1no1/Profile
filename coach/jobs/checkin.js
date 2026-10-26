import { notify } from '../lib/notify.js';
import { load } from '../lib/state.js';
import { hhmm, today } from '../lib/time.js';

// 08:00: nag if the morning ONE thing wasn't locked. 10:00: status ping.
export default async function checkin() {
  const s = load();
  if (hhmm() < '09:00') {
    if (s.lockedOn === today()) return;
    return notify(`🚨 *ONE thing not locked*\n🎯 Suggested: ${s.focus ?? '—'}\n👉 Lock it or change it. Days without a target get wasted.`, {
      buttons: [['✅ Locked in', 'focus:ok'], ['🔁 Change ONE thing', 'focus:change']],
    });
  }
  return notify(`🎯 *10:00 check-in*\n• ONE thing: ${s.focus ?? '❓ not set'}\n• 🛠 WIP: ${s.wip.length}/3\n👉 Where are you on it?`, {
    buttons: [['🟢 On it', 'checkin:green'], ['🟡 Stuck', 'checkin:yellow'], ['🔴 Not started', 'checkin:red']],
  });
}
