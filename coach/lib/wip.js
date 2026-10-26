import { settings } from './config.js';
import { update } from './state.js';

export function addWip(slug, limit = settings.wipLimit) {
  return update((s) => {
    if (s.wip.some((w) => w.slug === slug)) return { ok: true };
    if (s.wip.length >= limit) return { ok: false, wip: s.wip };
    s.wip.push({ slug, started: new Date().toISOString() });
    return { ok: true };
  });
}

export function parkWip(slug) {
  return update((s) => {
    const item = s.wip.find((w) => w.slug === slug);
    s.wip = s.wip.filter((w) => w.slug !== slug);
    if (item) s.parked.push({ ...item, parked: new Date().toISOString() });
    return Boolean(item);
  });
}

export function doneWip(slug) {
  return update((s) => {
    const before = s.wip.length;
    s.wip = s.wip.filter((w) => w.slug !== slug);
    return s.wip.length < before;
  });
}
