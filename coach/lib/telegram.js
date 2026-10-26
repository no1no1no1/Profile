import fs from 'node:fs';
import path from 'node:path';
import { secret, REPO } from './config.js';
import { notify } from './notify.js';
import { think } from './brain.js';
import { load, update, record } from './state.js';

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

async function onText(text) {
  const s = load();
  record('reply', { text: text.slice(0, 500) });
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
