import { secret } from '../lib/config.js';
import { notify } from '../lib/notify.js';

// Optional Grok job: X/Twitter digest on Novia, competitors, and AI-dev trends. Skips if no XAI_API_KEY.
export default async function xdigest() {
  const key = secret('XAI_API_KEY');
  if (!key) return;
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: process.env.XAI_MODEL || 'grok-4',
      messages: [{ role: 'user', content: 'From X in the last 24h: mentions of novia.solutions, notable moves by its competitors, and the top 3 AI coding/agent trends a startup CTO should know. Max 8 lines, with links.' }],
    }),
  });
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (text) await notify(`𝕏 *Daily X digest*\n${text}`);
}
