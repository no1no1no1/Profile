import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { think } from '../lib/brain.js';
import { notify } from '../lib/notify.js';
import { noviaMetrics } from '../lib/sources.js';
import { load } from '../lib/state.js';
import { REPO } from '../lib/config.js';

// Sunday: review the week, write reviews/YYYY-WW.md, and propose rule changes for approval.
function isoWeek(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const w = Math.ceil(((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(w).padStart(2, '0')}`;
}

function recentSessions() {
  const dir = path.join(os.homedir(), '.claude', 'projects');
  if (!fs.existsSync(dir)) return [];
  const weekAgo = Date.now() - 7 * 86400000;
  return fs.readdirSync(dir).flatMap((p) =>
    fs.readdirSync(path.join(dir, p))
      .filter((f) => f.endsWith('.jsonl') && fs.statSync(path.join(dir, p, f)).mtimeMs > weekAgo)
      .map((f) => path.join(dir, p, f))
  );
}

export default async function weekly() {
  const s = load();
  const week = isoWeek();
  const memo = await think('weekly', {
    week,
    log: s.log.filter((l) => Date.now() - new Date(l.at) < 7 * 86400000),
    commitments: s.commitments,
    streaks: s.streaks,
    parked: s.parked,
    metrics: await noviaMetrics(),
    claudeSessionFiles: recentSessions(),
  }, { timeoutMs: 600_000 });
  const out = path.join(REPO, 'reviews', `${week}.md`);
  fs.writeFileSync(out, memo + '\n');
  await notify(`📊 Weekly review ${week} is ready.\n\n${memo.slice(0, 1500)}`, { buttons: [['✅ Apply rule changes', `rules:apply:${week}`], ['❌ Skip', 'rules:skip']] });
}
