import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'fs';
import { fileURLToPath } from 'url';

export function buildSite(html, webhookUrl) {
  return html.replace('N8N_WEBHOOK_PLACEHOLDER', webhookUrl);
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  const webhook = process.env.N8N_WEBHOOK_URL || '';
  const html = readFileSync('index.html', 'utf8');
  const built = buildSite(html, webhook);
  mkdirSync('public/src', { recursive: true });
  writeFileSync('public/index.html', built);
  copyFileSync('src/form.js', 'public/src/form.js');
  copyFileSync('src/init.js', 'public/src/init.js');
  console.log('Build complete. Webhook:', webhook ? webhook.slice(0, 40) + '...' : 'not set');
}
