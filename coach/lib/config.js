import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

export const HOME = process.env.COACH_HOME || path.join(os.homedir(), '.coach');
export const REPO = path.resolve(new URL('../..', import.meta.url).pathname);

export const settings = {
  wipLimit: 3,
  telegramUser: 'noviasolutions',
  tz: 'Europe/Rome',
  sleep: { start: '23:30', end: '07:00' },
  // Machines you can talk to from Telegram. null = local (the mini runs the daemon); else a Tailscale SSH host.
  machines: { mini: null, mb: 'macbook' },
  // Local brain on the mini. 14b wants ~16GB free; smaller Macs get 8b.
  ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL || (os.totalmem() >= 24 * 2 ** 30 ? 'qwen3:14b' : os.totalmem() >= 16 * 2 ** 30 ? 'qwen3:8b' : 'qwen3:4b'),
  // Which brain each prompt uses. 'claude' = needs connectors/quality, 'local' = Ollama, free.
  tiers: { morning: 'claude', countdown: 'claude', calendar: 'claude', commitments: 'claude', weekly: 'claude', drift: 'local', reply: 'local' },
  metricsUrl: 'https://script.google.com/a/macros/novia.solutions/s/AKfycbz1UM_Vc6q2-7g-DUkOx1sndXrrt96FWrvx7YwV5KcYGOZ6S9WMN9MYVZx1I0Zm4oCs/exec',
};

// Secrets live in the macOS keychain (service "coach"); env vars override for testing.
export function secret(name) {
  if (process.env[name]) return process.env[name];
  try {
    return execFileSync('security', ['find-generic-password', '-s', 'coach', '-a', name, '-w'], { encoding: 'utf8' }).trim();
  } catch {
    return undefined;
  }
}
