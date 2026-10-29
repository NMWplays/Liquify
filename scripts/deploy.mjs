import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const appData = process.env.APPDATA;
if (!appData) {
  console.error('APPDATA is not set – are you on Windows?');
  process.exit(1);
}

const themeDir = join(appData, 'SpotiKit', 'Themes', 'Liquify V2');
mkdirSync(themeDir, { recursive: true });

copyFileSync('dist/theme.js', join(themeDir, 'theme.js'));

console.log(`Deployed to ${themeDir}`);
