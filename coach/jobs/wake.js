import { settings } from '../lib/config.js';
import { drain } from '../lib/queue.js';

// Every 2 min: deliver queued messages to any machine that has come back online.
export default async function wake() {
  for (const [machine, host] of Object.entries(settings.machines)) if (host) await drain(machine);
}
