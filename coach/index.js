#!/usr/bin/env node
// coach: proactive chief-of-staff CLI.
//   coach run <job> [--print]   morning|drift|countdown|commitments|body|shutdown|winddown|weekly
//   coach daemon                Telegram listener (two-way replies from iPhone)
//   coach wip add|park|done|ls <slug>
//   coach focus "<the ONE thing>"
//   coach notify <kind> <detail> (used by Claude Code hooks)
import { notify } from './lib/notify.js';
import { load, update } from './lib/state.js';
import { addWip, parkWip, doneWip } from './lib/wip.js';

const [cmd, sub, ...rest] = process.argv.slice(2);

const messages = {
  'agent-done': (d) => `🤖 Agent finished in \`${d.split('/').pop()}\`. Review it.`,
  'agent-needs-you': (d) => `✋ Agent in \`${d.split('/').pop()}\` needs a decision.`,
  'pr-ready': (d) => `🚀 PR ready: ${d}`,
};

switch (cmd) {
  case 'run': {
    const job = (await import(`./jobs/${sub}.js`)).default;
    await job({ print: rest.includes('--print') });
    break;
  }
  case 'daemon':
    await (await import('./lib/telegram.js')).listen();
    break;
  case 'wip': {
    if (sub === 'add') {
      const r = addWip(rest[0]);
      if (!r.ok) {
        await notify(`🛑 WIP limit hit (${r.wip.length}). Finish or /park one of: ${r.wip.map((w) => w.slug).join(', ')}`, { urgent: true });
        process.exit(1);
      }
    } else if (sub === 'park') parkWip(rest[0]);
    else if (sub === 'done') doneWip(rest[0]);
    else console.log(load().wip.map((w) => `• ${w.slug} (since ${w.started.slice(0, 16)})`).join('\n') || 'WIP empty');
    break;
  }
  case 'focus':
    update((s) => (s.focus = [sub, ...rest].join(' ')));
    break;
  case 'notify':
    await notify((messages[sub] ?? ((d) => `${sub}: ${d}`))(rest.join(' ')), { urgent: sub === 'agent-needs-you' });
    break;
  default:
    console.log('usage: coach run <job> | daemon | wip add|park|done|ls | focus <text> | notify <kind> <detail>');
}
