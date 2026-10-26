#!/usr/bin/env node
// Merges the repo's permissions + hooks into an existing ~/.claude/settings.json without
// dropping anything already there (plugins, env, model, statusLine...). Safe to re-run.
import fs from 'node:fs';

const [repoFile, userFile] = process.argv.slice(2);
const repo = JSON.parse(fs.readFileSync(repoFile, 'utf8'));
let user = {};
if (fs.existsSync(userFile)) {
  user = JSON.parse(fs.readFileSync(userFile, 'utf8'));
  fs.copyFileSync(userFile, `${userFile}.bak-${Date.now()}`);
}
const union = (a = [], b = []) => [...new Set([...a, ...b])];
user.permissions ??= {};
for (const k of ['allow', 'deny']) user.permissions[k] = union(user.permissions[k], repo.permissions[k]);
user.hooks ??= {};
for (const [event, entries] of Object.entries(repo.hooks)) {
  const existing = user.hooks[event] ?? [];
  const cmds = new Set(existing.flatMap((e) => e.hooks?.map((h) => h.command) ?? []));
  user.hooks[event] = [...existing, ...entries.filter((e) => !e.hooks.every((h) => cmds.has(h.command)))];
}
fs.writeFileSync(userFile, JSON.stringify(user, null, 2) + '\n');
console.log(`merged into ${userFile}`);
