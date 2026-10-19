const fs = require('node:fs');
const path = require('node:path');
const projectRoot = path.resolve(__dirname, '../..');
const siteRoot = path.resolve(process.env.SOLAR_SITE_ROOT || path.join(projectRoot, 'dist'));
if (!fs.existsSync(path.join(siteRoot, 'terminal/index.html'))) throw new Error('Run npm run build before browser checks.');
fs.mkdirSync(path.join(projectRoot, '.qa'), { recursive: true });
module.exports = {
  siteRoot,
  browserChannel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined),
};
