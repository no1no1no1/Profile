import { secret } from './config.js';
import { isQuiet } from './time.js';
import { record } from './state.js';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// LLMs write CommonMark (**bold**, # headings, - bullets); Telegram's HTML mode is the
// only one that renders it reliably, so convert. Code is pulled out first so it isn't touched.
export function md2html(text) {
  const code = [];
  const keep = (html) => `\u0000${code.push(html) - 1}\u0000`;
  let s = text
    .replace(/```\w*\n?([\s\S]*?)```/g, (_, c) => keep(`<pre>${esc(c.trim())}</pre>`))
    .replace(/`([^`\n]+)`/g, (_, c) => keep(`<code>${esc(c)}</code>`));
  s = esc(s)
    .replace(/^#{1,6}\s+(.+)$/gm, '**$1**')
    .replace(/^(\s*)[-*]\s+/gm, '$1• ')
    .replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>')
    .replace(/\*([^*\s][^*\n]*?)\*/g, '<b>$1</b>')
    .replace(/(^|[^\w])_([^_\n]+)_(?![\w])/g, '$1<i>$2</i>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => code[i]);
}

// Sends a message to the user's Telegram (shows as an iPhone push).
// urgent=true bypasses the sleep window (e.g. a meeting in 10 minutes).
// plain=true sends raw text (terminal screens from /peek).
export async function notify(text, { urgent = false, buttons, plain = false } = {}) {
  if (!urgent && isQuiet()) {
    record('suppressed', { text });
    return false;
  }
  const token = secret('TELEGRAM_BOT_TOKEN');
  const chat = secret('TELEGRAM_CHAT_ID');
  if (!token || !chat) {
    console.log(`[notify] ${text}`);
    return false;
  }
  // Telegram caps messages at 4096 chars; send long output in chunks.
  if (text.length > 3500) {
    for (let i = 0; i < text.length; i += 3500) await notify(text.slice(i, i + 3500), { urgent: true, plain });
    return true;
  }
  const send = (body) =>
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, disable_web_page_preview: true, ...body }),
    });
  const extra = buttons ? { reply_markup: { inline_keyboard: [buttons.map(([t, d]) => ({ text: t, callback_data: d }))] } } : {};
  let res = await send(plain ? { text, ...extra } : { text: md2html(text), parse_mode: 'HTML', ...extra });
  // Never lose a message to a formatting error: fall back to raw text.
  if (!res.ok && !plain) res = await send({ text, ...extra });
  record('notify', { text: text.slice(0, 200) });
  return res.ok;
}
