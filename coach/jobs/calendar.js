import fs from 'node:fs';
import path from 'node:path';
import { think } from '../lib/brain.js';
import { HOME } from '../lib/config.js';
import { isQuiet } from '../lib/time.js';

// Hourly: cache upcoming events so the 5-minute countdown needs no AI call.
export default async function calendar() {
  if (isQuiet()) return; // nobody reads the countdown overnight
  const raw = await think('calendar', { now: new Date().toISOString() }, { tier: 'claude', model: 'haiku' });
  const events = JSON.parse(raw.slice(raw.indexOf('['), raw.lastIndexOf(']') + 1));
  fs.mkdirSync(HOME, { recursive: true });
  fs.writeFileSync(path.join(HOME, 'calendar.json'), JSON.stringify({ at: new Date().toISOString(), events }, null, 2));
}
