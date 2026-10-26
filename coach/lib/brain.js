import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { REPO } from './config.js';

// Runs headless Claude Code with a prompt template from coach/prompts plus live context.
// Claude Code uses the connectors on the logged-in account (Gmail, Calendar, GitHub)
// and must stay read-only/draft-only here: the guardrails come from rules.md.
export function think(promptName, context = {}, { timeoutMs = 240_000 } = {}) {
  const rules = fs.readFileSync(path.join(REPO, 'coach/rules.md'), 'utf8');
  const template = fs.readFileSync(path.join(REPO, 'coach/prompts', `${promptName}.md`), 'utf8');
  const prompt = `${rules}\n\n---\n${template}\n\n---\nContext (JSON):\n${JSON.stringify(context, null, 2)}`;
  return new Promise((resolve, reject) => {
    const child = spawn('claude', ['-p', prompt, '--output-format', 'text'], { cwd: REPO });
    let out = '';
    let err = '';
    const timer = setTimeout(() => child.kill('SIGTERM'), timeoutMs);
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('close', (code) => {
      clearTimeout(timer);
      code === 0 ? resolve(out.trim()) : reject(new Error(`claude exited ${code}: ${err.slice(0, 500)}`));
    });
  });
}
