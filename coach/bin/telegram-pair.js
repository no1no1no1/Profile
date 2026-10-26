#!/usr/bin/env node
// Finds your Telegram chat id: message the bot from @noviasolutions, then run this.
// Saves TELEGRAM_CHAT_ID to the keychain. Only messages from settings.telegramUser count.
import { execFileSync } from 'node:child_process';
import { secret, settings } from '../lib/config.js';

const token = secret('TELEGRAM_BOT_TOKEN');
if (!token) throw new Error('Store TELEGRAM_BOT_TOKEN first (coach/bin/secrets.sh)');
console.log(`Send any message to your bot from @${settings.telegramUser}… (waiting up to 2 min)`);
const deadline = Date.now() + 120_000;
while (Date.now() < deadline) {
  const { result = [] } = await (await fetch(`https://api.telegram.org/bot${token}/getUpdates?timeout=20`)).json();
  const msg = result.map((u) => u.message).find((m) => m?.from?.username?.toLowerCase() === settings.telegramUser);
  if (msg) {
    execFileSync('security', ['add-generic-password', '-U', '-s', 'coach', '-a', 'TELEGRAM_CHAT_ID', '-w', String(msg.chat.id)]);
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: msg.chat.id, text: '✅ Paired with your Mac mini. Send /help.' }),
    });
    console.log(`Paired: chat id ${msg.chat.id}`);
    process.exit(0);
  }
}
console.error('No message from that username yet. Try again.');
process.exit(1);
