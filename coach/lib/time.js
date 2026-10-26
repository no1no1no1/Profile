import { settings } from './config.js';

export function hhmm(d = new Date()) {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: settings.tz });
}

// True during the sleep window; handles windows that cross midnight.
export function isQuiet(d = new Date(), { start, end } = settings.sleep) {
  const t = hhmm(d);
  return start > end ? t >= start || t < end : t >= start && t < end;
}

// YYYY-MM-DD in the user's timezone.
export const today = (d = new Date()) => d.toLocaleDateString('en-CA', { timeZone: settings.tz });
