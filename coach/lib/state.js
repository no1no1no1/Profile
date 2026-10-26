import fs from 'node:fs';
import path from 'node:path';
import { HOME } from './config.js';

const FILE = path.join(HOME, 'state.json');
const EMPTY = { focus: null, wip: [], parked: [], commitments: [], streaks: { workout: 0, shutdown: 0 }, log: [] };

export function load() {
  try {
    return { ...EMPTY, ...JSON.parse(fs.readFileSync(FILE, 'utf8')) };
  } catch {
    return structuredClone(EMPTY);
  }
}

export function save(state) {
  fs.mkdirSync(HOME, { recursive: true });
  state.log = state.log.slice(-500);
  fs.writeFileSync(FILE + '.tmp', JSON.stringify(state, null, 2));
  fs.renameSync(FILE + '.tmp', FILE);
}

export function update(fn) {
  const s = load();
  const out = fn(s);
  save(s);
  return out;
}

export function record(kind, data = {}) {
  update((s) => s.log.push({ at: new Date().toISOString(), kind, ...data }));
}
