import { notify } from '../lib/notify.js';

export default async function winddown() {
  await notify('😴 *Wind-down 22:30*\n• Protein in? Magnesium? Lights low.\n• Agents can run overnight; you can\'t.\n👉 Screens down in 30.');
}
