import { claudeOn, isOnline } from './remote.js';
import { notify } from './notify.js';
import { load, update } from './state.js';

// Messages for a machine that's off (the MacBook) wait here until it wakes.
export function enqueue(item) {
  return update((s) => {
    s.queue = [...(s.queue ?? []), { ...item, at: new Date().toISOString() }];
    return s.queue.length;
  });
}

export async function drain(machine, { online = isOnline, run = claudeOn } = {}) {
  const pending = (load().queue ?? []).filter((q) => q.machine === machine);
  if (!pending.length || !(await online(machine))) return 0;
  await notify(`🔌 ${machine} is back. Running ${pending.length} queued message(s).`, { urgent: true });
  let sent = 0;
  for (const item of pending) {
    try {
      const { text } = await run(machine, { cwd: item.cwd, prompt: item.prompt });
      await notify(`[${machine}, queued ${item.at.slice(11, 16)}] ${text}`, { urgent: true, plain: true });
    } catch (e) {
      await notify(`⚠️ ${machine}: ${e.message}`, { urgent: true, plain: true });
    }
    // Remove each one as it's handled, so a crash mid-drain never runs one twice.
    update((s) => { s.queue = s.queue.filter((q) => q.at !== item.at || q.prompt !== item.prompt); });
    sent++;
  }
  return sent;
}
