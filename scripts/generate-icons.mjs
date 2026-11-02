import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '..', 'public');
const svg = readFileSync(resolve(publicDir, 'favicon.svg'));

const sizes = [
  { name: 'favicon-32.png', size: 32, dir: publicDir },
  { name: 'apple-touch-icon.png', size: 180, dir: publicDir },
  { name: 'icon-192.png', size: 192, dir: resolve(publicDir, 'icons') },
  { name: 'icon-512.png', size: 512, dir: resolve(publicDir, 'icons') },
];

for (const { name, size, dir } of sizes) {
  await sharp(svg).resize(size, size).png().toFile(resolve(dir, name));
  console.log(`Generated ${name} (${size}x${size})`);
}
