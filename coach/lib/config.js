import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

export const HOME = process.env.COACH_HOME || path.join(os.homedir(), '.coach');
export const REPO = path.resolve(new URL('../..', import.meta.url).pathname);

export const settings = {
  wipLimit: 3,
  tz: 'Europe/Rome',
  sleep: { start: '23:30', end: '07:00' },
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
