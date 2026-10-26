import fs from 'node:fs';
import path from 'node:path';
import { secret, REPO } from './config.js';
import { notify } from './notify.js';
import { think } from './brain.js';
import { load, update, record } from './state.js';
import { settings } from './config.js';
import { claudeOn, tmuxOn, isOnline, OfflineError } from './remote.js';
import { enqueue } from './queue.js';
import { ollama } from './brain.js';
import { execFile } from 'node:child_process';

// Long-polls Telegram so the user can reply to the coach from the iPhone.
// Only messages from TELEGRAM_CHAT_ID are accepted.
export async function listen() {
  const token = secret('TELEGRAM_BOT_TOKEN');
  const chat = String(secret('TELEGRAM_CHAT_ID'));
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN missing');
  const api = (m, body) =>
    fetch(`https://api.telegram.org/bot${token}/${m}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json());
  let offset = 0;
  for (;;) {
    try {
      const { result = [] } = await api('getUpdates', { offset, timeout: 50 });
      for (const u of result) {
        offset = u.update_id + 1;
        const from = String(u.message?.chat.id ?? u.callback_query?.message.chat.id);
        if (from !== chat) continue;
        if (u.callback_query) {
          await api('answerCallbackQuery', { callback_query_id: u.callback_query.id });
          await onButton(u.callback_query.data);
        } else if (u.message?.text) {
          await onText(u.message.text);
        }
      }
    } catch (e) {
      console.error(e);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

async function onButton(data) {
  if (data === 'focus:change') {
    update((s) => { s.awaiting = 'focus'; });
    return notify('What is the ONE thing? Reply here.');
  }
  if (data === 'focus:ok') return notify('🔒 Locked. Go.');
  if (data === 'drift:back') return notify('👊 Back to it.');
  if (data.startsWith('rules:apply:')) return applyRules(data.split(':')[2]);
}

function applyRules(week) {
  const memo = fs.readFileSync(path.join(REPO, 'reviews', `${week}.md`), 'utf8');
  const m = memo.match(/## Proposed rules\.md\s*```(?:markdown|md)?\n([\s\S]*?)```/);
  if (!m) return notify('No rule changes in that review.');
  fs.writeFileSync(path.join(REPO, 'coach/rules.md'), m[1]);
  record('rules-updated', { week });
  return notify('✅ Rules updated. Commit the repo on the mini to keep history.');
}

const HELP = `*Talk to your machines*
/mini [dir] - chat with Claude on the Mac mini (e.g. /mini ~/work/novia-app)
/mb [dir] - chat with Claude on the MacBook
/new - fresh conversation on the current machine
/coach - back to the coach
\`mb: <msg>\` or \`mini: <msg>\` - one-off message without switching
/agents - running agents on both machines
/peek <machine> <agent> - last screen of an agent
/tell <machine> <agent> <msg> - type into a running agent
/spawn <repo> <task> - start a new agent on the mini
/local <msg> - ask Ollama on the mini (free, private)
/queue [clear] - messages waiting for the MacBook to wake`;

const machineNames = () => Object.keys(settings.machines);

async function onText(text) {
  const s = load();
  record('reply', { text: text.slice(0, 500) });
  const cmd = text.match(/^\/(\w+)\s*([\s\S]*)$/);
  if (cmd && (await onCommand(cmd[1].toLowerCase(), cmd[2].trim()))) return;
  const oneOff = text.match(/^(\w+):\s*([\s\S]+)$/);
  if (oneOff && machineNames().includes(oneOff[1].toLowerCase())) {
    return talk({ machine: oneOff[1].toLowerCase(), cwd: '~' }, oneOff[2], false);
  }
  if (s.chat) return talk(s.chat, text, true);
  if (s.awaiting === 'focus' || /^focus[: ]/i.test(text)) {
    const focus = text.replace(/^focus[: ]\s*/i, '');
    update((st) => { st.focus = focus; st.awaiting = null; });
    return notify(`🎯 ONE thing: *${focus}*`);
  }
  // Anything else: the coach reads it in context and responds/updates state.
  const reply = await think('reply', { message: text, state: { focus: s.focus, wip: s.wip, commitments: s.commitments.filter((c) => !c.done), streaks: s.streaks } });
  const actions = reply.match(/```json\n([\s\S]*?)```/);
  if (actions) {
    try { applyActions(JSON.parse(actions[1])); } catch (e) { console.error('bad actions', e); }
  }
  await notify(reply.replace(/```json[\s\S]*?```/, '').trim(), { urgent: true });
}

// The brain may return {focus, done:[what], add:[{what,due}], trained:bool, shutdown:bool}.
function applyActions(a) {
  update((s) => {
    if (a.focus) s.focus = a.focus;
    for (const w of a.done ?? []) for (const c of s.commitments) if (c.what === w) c.done = true;
    for (const c of a.add ?? []) s.commitments.push({ ...c, done: false, added: new Date().toISOString() });
    if (a.trained === true) s.streaks.workout += 1;
    if (a.trained === false) s.streaks.workout = 0;
    if (a.shutdown) s.streaks.shutdown += 1;
  });
}

async function onCommand(name, arg) {
  if (machineNames().includes(name)) {
    update((s) => { s.chat = { machine: name, cwd: arg || '~', sessionId: null }; });
    await notify(`💬 Now talking to Claude on *${name}* in \`${arg || '~'}\`. /coach to switch back.`, { urgent: true });
      return true;
  }
  switch (name) {
    case 'help': case 'start':
      await notify(HELP, { urgent: true });
      return true;
    case 'coach':
      update((s) => { s.chat = null; });
      await notify('🧠 Back to the coach.', { urgent: true });
      return true;
    case 'new':
      update((s) => { if (s.chat) s.chat.sessionId = null; });
      await notify('🆕 Fresh conversation.', { urgent: true });
      return true;
    case 'agents': {
      const lists = await Promise.all(machineNames().map(async (m) =>
        (await isOnline(m)) ? `*${m}*\n${(await tmuxOn(m, ['list-windows', '-t', 'agents', '-F', '#W'])) || 'none'}` : `*${m}*: offline`));
      await notify(lists.join('\n\n'), { urgent: true });
      return true;
    }
    case 'peek': {
      const [m, w] = arg.split(/\s+/);
      const screen = await tmuxOn(m, ['capture-pane', '-p', '-t', `agents:${w}`, '-S', '-40']);
      await notify(screen.slice(-3500) || '(empty)', { urgent: true, plain: true });
      return true;
    }
    case 'tell': {
      const [, m, w, msg] = arg.match(/^(\S+)\s+(\S+)\s+([\s\S]+)$/) ?? [];
      if (!msg) await notify('usage: /tell <machine> <agent> <msg>', { urgent: true });
      return true;
      await tmuxOn(m, ['send-keys', '-t', `agents:${w}`, '-l', msg]);
      await tmuxOn(m, ['send-keys', '-t', `agents:${w}`, 'Enter']);
      await notify(`⌨️ Sent to ${m}:${w}. /peek ${m} ${w} to see the reply.`, { urgent: true });
      return true;
    }
    case 'local': {
      ollama(arg).then((t) => notify(`[local] ${t}`, { urgent: true, plain: true }), (e) => notify(`⚠️ ollama: ${e.message}`, { urgent: true }));
      return true;
    }
    case 'queue': {
      if (arg === 'clear') update((s) => { s.queue = []; });
      const q = load().queue ?? [];
      await notify(q.length ? q.map((i) => `• ${i.machine}: ${i.prompt.slice(0, 80)}`).join('\n') : 'Queue empty.', { urgent: true, plain: true });
      return true;
    }
    case 'spawn': {
      const [, repo, task] = arg.match(/^(\S+)\s+([\s\S]+)$/) ?? [];
      if (!task) await notify('usage: /spawn <repo dir> <task>', { urgent: true });
      return true;
      execFile('zsh', ['-lc', `~/bin/agent new ${repo} ${JSON.stringify(task)}`], (e, out, err) =>
        notify((out || err || String(e)).trim().slice(0, 1000), { urgent: true, plain: true }));
      return true;
    }
  }
  return false;
}

// Runs in the background so the Telegram loop keeps answering while Claude works.
function talk(chat, prompt, keep) {
  notify(`⏳ ${chat.machine} is on it…`, { urgent: true });
  claudeOn(chat.machine, { cwd: chat.cwd, prompt, sessionId: keep ? chat.sessionId : null })
    .then(({ text, sessionId }) => {
      if (keep) update((s) => { if (s.chat?.machine === chat.machine) s.chat.sessionId = sessionId; });
      return notify(`[${chat.machine}] ${text}`, { urgent: true, plain: true });
    })
    .catch((e) => {
      if (!(e instanceof OfflineError)) return notify(`⚠️ ${chat.machine}: ${e.message}`, { urgent: true, plain: true });
      const n = enqueue({ machine: chat.machine, cwd: chat.cwd, prompt });
      return notify(`📥 ${chat.machine} is off. Queued (#${n}); I'll run it when it wakes.`, { urgent: true });
    });
}
