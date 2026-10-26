import { notify } from '../lib/notify.js';

export default async function winddown() {
  await notify('🛏 22:30: screens down in 30. Protein in? Magnesium? Lights low. Agents can run overnight; you can\'t.');
}
