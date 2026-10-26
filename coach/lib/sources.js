import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { settings, secret } from './config.js';

// Novia KPIs from the Apps Script web app. Expected to return JSON; falls back to raw text.
export async function noviaMetrics() {
  try {
    const url = new URL(settings.metricsUrl);
    const key = secret('NOVIA_METRICS_KEY');
    if (key) url.searchParams.set('key', key);
    const res = await fetch(url, { redirect: 'follow' });
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { raw: text.slice(0, 2000), status: res.status }; }
  } catch (e) {
    return { error: String(e) };
  }
}

// Fitbit Web API: last night's sleep + yesterday's activity. Needs an OAuth token in the keychain.
export async function health() {
  const token = secret('FITBIT_TOKEN');
  if (!token) return { error: 'no FITBIT_TOKEN; run coach/bin/secrets.sh' };
  const day = new Date().toISOString().slice(0, 10);
  const get = async (p) => (await fetch(`https://api.fitbit.com${p}`, { headers: { authorization: `Bearer ${token}` } })).json();
  try {
    const [sleep, activity] = await Promise.all([
      get(`/1.2/user/-/sleep/date/${day}.json`),
      get(`/1/user/-/activities/date/${day}.json`),
    ]);
    return {
      sleepMinutes: sleep.summary?.totalMinutesAsleep,
      sleepEfficiency: sleep.sleep?.[0]?.efficiency,
      steps: activity.summary?.steps,
      restingHR: activity.summary?.restingHeartRate,
    };
  } catch (e) {
    return { error: String(e) };
  }
}

// What the user is actually doing: active tmux agent windows + recent commits in ~/work.
export function activity() {
  const sh = (cmd, args) => { try { return execFileSync(cmd, args, { encoding: 'utf8' }).trim(); } catch { return ''; } };
  const windows = sh('tmux', ['list-windows', '-t', 'agents', '-F', '#{window_name} #{window_activity}'])
    .split('\n').filter(Boolean).map((l) => {
      const [name, ts] = l.split(' ');
      return { name, idleMin: Math.round((Date.now() / 1000 - Number(ts)) / 60) };
    });
  const work = path.join(os.homedir(), 'work');
  const commits = fs.existsSync(work)
    ? fs.readdirSync(work).flatMap((d) => sh('git', ['-C', path.join(work, d), 'log', '--since=4.hours', '--format=' + d + ': %s']).split('\n').filter(Boolean))
    : [];
  return { windows, recentCommits: commits.slice(0, 20) };
}
