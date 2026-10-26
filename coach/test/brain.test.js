import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';

process.env.COACH_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'coach-'));
process.env.CLAUDE_BIN = '/nonexistent/claude';
process.env.TELEGRAM_BOT_TOKEN = '';
// Fake Ollama
const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', (d) => (body += d));
  req.on('end', () => res.end(JSON.stringify({ message: { content: `<think>x</think>local:${JSON.parse(body).model}` } })));
}).listen(0);
await new Promise((r) => server.once('listening', r));
process.env.OLLAMA_URL = `http://localhost:${server.address().port}`;
process.env.OLLAMA_MODEL = 'test-model';

const { think } = await import('../lib/brain.js');
const { dueEvent } = await import('../jobs/countdown.js');
const { enqueue, drain } = await import('../lib/queue.js');
const { load } = await import('../lib/state.js');

test.after(() => server.close());

test('local tier goes to Ollama and strips <think>', async () => {
  assert.equal(await think('drift', {}), 'local:test-model');
});

test('claude failure falls back to Ollama, tagged', async () => {
  assert.match(await think('morning', {}), /^local:test-model\n_\(local brain\)_$/);
});

test('countdown only fires 8-15 min before, once', () => {
  const now = Date.parse('2026-10-27T10:00:00Z');
  const ev = [{ id: 'a', start: '2026-10-27T10:30:00Z' }, { id: 'b', start: '2026-10-27T10:10:00Z' }];
  assert.equal(dueEvent(ev, [], now).id, 'b');
  assert.equal(dueEvent(ev, ['b'], now), undefined);
});

test('queue waits while offline, drains once when back', async () => {
  enqueue({ machine: 'mb', cwd: '~', prompt: 'hello' });
  const run = mock.fn(async () => ({ text: 'hi' }));
  assert.equal(await drain('mb', { online: async () => false, run }), 0);
  assert.equal(load().queue.length, 1);
  assert.equal(await drain('mb', { online: async () => true, run }), 1);
  assert.equal(run.mock.callCount(), 1);
  assert.equal(load().queue.length, 0);
});
