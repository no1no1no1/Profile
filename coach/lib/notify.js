import { secret } from './config.js';
import { isQuiet } from './time.js';
import { record } from './state.js';

// Sends a message to the user's Telegram (shows as an iPhone push).
// urgent=true bypasses the sleep window (e.g. a meeting in 10 minutes).
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
  if (text.length > 4000) {
    for (let i = 0; i < text.length; i += 4000) await notify(text.slice(i, i + 4000), { urgent: true, plain });
    return true;
  }
  const body = { chat_id: chat, text, disable_web_page_preview: true };
  if (!plain) body.parse_mode = 'Markdown';
  if (buttons) body.reply_markup = { inline_keyboard: [buttons.map(([t, d]) => ({ text: t, callback_data: d }))] };
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  record('notify', { text: text.slice(0, 200) });
  return res.ok;
}
