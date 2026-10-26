import fs from 'node:fs';
import path from 'node:path';
import { think } from '../lib/brain.js';
import { notify } from '../lib/notify.js';
import { HOME } from '../lib/config.js';
import { load, update } from '../lib/state.js';

// Every 5 min, plain code: is a cached event 8-15 min away? Only then ask Claude for a prep note.
export function dueEvent(events, pinged, now = Date.now()) {
  return events.find((e) => {
    const min = (new Date(e.start) - now) / 60_000;
    return min >= 8 && min <= 15 && !pinged.includes(e.id);
  });
}

export default async function countdown() {
  let cache;
  try { cache = JSON.parse(fs.readFileSync(path.join(HOME, 'calendar.json'), 'utf8')); } catch { return; }
  const event = dueEvent(cache.events, load().pingedEvents ?? []);
  if (!event) return;
  update((st) => (st.pingedEvents = [...(st.pingedEvents ?? []), event.id].slice(-50)));
  const minutes = Math.round((new Date(event.start) - Date.now()) / 60_000);
  let text;
  try { text = await think('countdown', { event, minutes }, { timeoutMs: 120_000 }); }
  catch { text = `*${event.title}* in ${minutes} min ${event.link ?? ''}`; }
  await notify(`⏰ ${text}`, { urgent: true });
}
