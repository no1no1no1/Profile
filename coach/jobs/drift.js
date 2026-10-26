import { think } from '../lib/brain.js';
import { notify } from '../lib/notify.js';
import { activity } from '../lib/sources.js';
import { load } from '../lib/state.js';

// Compares the declared ONE thing with what git/tmux show you doing.
export default async function drift() {
  const s = load();
  if (!s.focus) return notify('🚨 *No ONE thing set*\n👉 Reply with today\'s ONE thing. One line.');
  const text = await think('drift', { focus: s.focus, wip: s.wip, activity: activity() });
  if (text.trim() !== 'ON_TRACK') await notify(text, { buttons: [['↩️ Back to it', 'drift:back'], ['🔀 Swap focus', 'focus:change']] });
}
