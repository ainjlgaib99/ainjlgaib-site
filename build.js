const fs = require('fs');
const webhook = process.env.N8N_WEBHOOK_URL || '';
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace('N8N_WEBHOOK_PLACEHOLDER', webhook);
fs.mkdirSync('public', { recursive: true });
fs.writeFileSync('public/index.html', html);
console.log('Build complete. Webhook:', webhook ? webhook.slice(0, 40) + '...' : 'not set');
