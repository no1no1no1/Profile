import { spawn } from 'node:child_process';
import { settings } from './config.js';

// Runs Claude Code on a machine in the mesh and keeps the conversation going via --resume.
// host null = this machine (the mini); otherwise an SSH host over Tailscale (e.g. "macbook").
// The prompt goes in on stdin, so it never needs shell quoting.
const q = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

export function claudeOn(machine, { cwd = '~', prompt, sessionId, timeoutMs = 15 * 60_000 }) {
  const host = settings.machines[machine];
  if (host === undefined) return Promise.reject(new Error(`unknown machine "${machine}"`));
  const args = ['-p', '--output-format', 'json', '--permission-mode', 'acceptEdits', ...(sessionId ? ['--resume', sessionId] : [])];
  const dir = cwd === '~' ? '"$HOME"' : cwd.startsWith('~/') ? `"$HOME"/${q(cwd.slice(2))}` : q(cwd);
  const script = `cd ${dir} && claude ${args.map(q).join(' ')}`;
  const [cmd, cmdArgs] = host ? ['ssh', ['-o', 'ConnectTimeout=8', host, `zsh -lc ${q(script)}`]] : ['zsh', ['-lc', script]];
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, cmdArgs);
    let out = '';
    let err = '';
    const timer = setTimeout(() => child.kill('SIGTERM'), timeoutMs);
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', reject);
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 255 && host) return reject(new OfflineError(`${machine} is offline or asleep`));
      try {
        const r = JSON.parse(out);
        resolve({ text: r.result ?? '(no output)', sessionId: r.session_id });
      } catch {
        reject(new Error(err.trim().slice(0, 500) || `claude exited ${code}`));
      }
    });
    child.stdin.end(prompt);
  });
}

// Lists the agent tmux windows on a machine, and shows/drives one by name.
export function tmuxOn(machine, tmuxArgs) {
  const host = settings.machines[machine];
  const script = `tmux ${tmuxArgs.map(q).join(' ')}`;
  const [cmd, cmdArgs] = host ? ['ssh', ['-o', 'ConnectTimeout=8', host, `zsh -lc ${q(script)}`]] : ['zsh', ['-lc', script]];
  return new Promise((resolve) => {
    const child = spawn(cmd, cmdArgs);
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (out += d));
    child.on('close', () => resolve(out.trim()));
    child.on('error', (e) => resolve(String(e)));
  });
}

// Quick reachability check (Tailscale SSH). The local machine is always online.
export function isOnline(machine) {
  const host = settings.machines[machine];
  if (!host) return Promise.resolve(true);
  return new Promise((resolve) => {
    const child = spawn('ssh', ['-o', 'ConnectTimeout=5', '-o', 'BatchMode=yes', host, 'true']);
    child.on('close', (code) => resolve(code === 0));
    child.on('error', () => resolve(false));
  });
}

export class OfflineError extends Error {}
