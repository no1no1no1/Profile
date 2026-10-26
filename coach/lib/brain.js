import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { REPO, settings } from './config.js';

// The brain lives on the mini. Two tiers:
//   claude: headless Claude Code with the account's connectors (Gmail, Calendar, GitHub)
//   local:  Ollama, free and private, for frequent jobs that only need the context we pass in
// If Claude fails, we fall back to Ollama with the same context and tag the answer.
export async function think(promptName, context = {}, { tier = settings.tiers[promptName] ?? 'claude', timeoutMs = 240_000 } = {}) {
  const prompt = buildPrompt(promptName, context);
  if (tier === 'local') return ollama(prompt);
  try {
    return await claude(prompt, timeoutMs);
  } catch (e) {
    console.error(`claude failed, using local brain: ${e.message}`);
    return `${await ollama(prompt)}\n_(local brain)_`;
  }
}

export function buildPrompt(promptName, context) {
  const rules = fs.readFileSync(path.join(REPO, 'coach/rules.md'), 'utf8');
  const template = fs.readFileSync(path.join(REPO, 'coach/prompts', `${promptName}.md`), 'utf8');
  return `${rules}\n\n---\n${template}\n\n---\nContext (JSON):\n${JSON.stringify(context, null, 2)}`;
}

export async function ollama(prompt, { model = settings.ollamaModel } = {}) {
  const res = await fetch(`${settings.ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model, stream: false, think: false, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) throw new Error(`ollama ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.message.content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

function claude(prompt, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.env.CLAUDE_BIN || 'claude', ['-p', '--output-format', 'text'], { cwd: REPO });
    let out = '';
    let err = '';
    const timer = setTimeout(() => child.kill('SIGTERM'), timeoutMs);
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', reject);
    child.on('close', (code) => {
      clearTimeout(timer);
      code === 0 ? resolve(out.trim()) : reject(new Error(`claude exited ${code}: ${err.slice(0, 500)}`));
    });
    child.stdin.end(prompt);
  });
}
