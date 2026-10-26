import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.COACH_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'coach-'));
const { addWip, parkWip, doneWip } = await import('../lib/wip.js');
const { load } = await import('../lib/state.js');
const { isQuiet } = await import('../lib/time.js');

test('WIP limit blocks the 4th task', () => {
  assert.ok(addWip('a', 3).ok);
  assert.ok(addWip('b', 3).ok);
  assert.ok(addWip('c', 3).ok);
  assert.equal(addWip('d', 3).ok, false);
  assert.ok(addWip('a', 3).ok, 're-adding an existing task is fine');
});

test('park frees a slot and records it', () => {
  assert.ok(parkWip('b'));
  assert.ok(addWip('d', 3).ok);
  assert.equal(load().parked[0].slug, 'b');
  assert.ok(doneWip('d'));
});

test('sleep window across midnight', () => {
  const w = { start: '23:30', end: '07:00' };
  const at = (h, m) => { const d = new Date(); d.setHours(h, m); return d; };
  process.env.TZ = 'Europe/Rome';
  // isQuiet formats in settings.tz; build dates in that tz by using TZ env above
  assert.equal(isQuiet(at(23, 45), w), true);
  assert.equal(isQuiet(at(3, 0), w), true);
  assert.equal(isQuiet(at(7, 0), w), false);
  assert.equal(isQuiet(at(14, 0), w), false);
});
