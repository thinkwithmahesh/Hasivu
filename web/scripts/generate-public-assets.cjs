/**
 * Generates committed PWA icons, OG images, splash placeholders, and video poster
 * under `public/`. Run after dependency install: `npm run generate:public-assets`
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const pub = (...segments) => path.join(ROOT, 'public', ...segments);

const brand = {
  orange: '#FF6B35',
  cream: '#FFF8F0',
  ink: '#1a1a2e',
  teal: '#2EC4B6',
  green: '#43A047',
  red: '#EF4444',
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function writePngFromSvg(svg, outPath, width, height) {
  await sharp(Buffer.from(svg)).resize(width, height).png({ compressionLevel: 9 }).toFile(outPath);
}

async function writeJpegFromSvg(svg, outPath, width, height) {
  await sharp(Buffer.from(svg)).resize(width, height).jpeg({ quality: 82 }).toFile(outPath);
}

function iconSvg(letter, bg, opts = {}) {
  const { radius = 96 } = opts;
  const fontSize = 280;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect fill="${bg}" width="512" height="512" rx="${radius}"/>
  <text x="256" y="${256 + fontSize * 0.32}" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="900" font-size="${fontSize}" fill="#ffffff">${letter}</text>
</svg>`;
}

function ogWideSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <rect fill="${brand.cream}" width="1200" height="630"/>
  <rect x="64" y="64" width="120" height="120" rx="28" fill="${brand.orange}"/>
  <text x="124" y="152" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="900" font-size="72" fill="#ffffff">H</text>
  <text x="220" y="130" font-family="system-ui,sans-serif" font-weight="900" font-size="56" fill="${brand.ink}">HASIVU</text>
  <text x="220" y="190" font-family="system-ui,sans-serif" font-size="28" fill="#5C554A">School meals done right</text>
  <text x="80" y="540" font-family="system-ui,sans-serif" font-size="22" fill="#9E9589">hasivu.com</text>
</svg>`;
}

function ogSquareSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200">
  <rect fill="${brand.orange}" width="1200" height="1200" rx="200"/>
  <text x="600" y="720" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="900" font-size="520" fill="#ffffff">H</text>
</svg>`;
}

function splashSvg(w, h) {
  const cx = w / 2;
  const cy = h * 0.38;
  const r = Math.min(w, h) * 0.14;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
  <rect fill="${brand.cream}" width="${w}" height="${h}"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${brand.orange}"/>
  <text x="${cx}" y="${cy + r * 0.35}" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="900" font-size="${r * 1.1}" fill="#ffffff">H</text>
  <text x="${cx}" y="${h * 0.72}" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="${Math.max(28, w * 0.035)}" fill="${brand.ink}">HASIVU</text>
</svg>`;
}

function screenshotSvg(w, h, label, accent) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${brand.cream}"/>
      <stop offset="100%" style="stop-color:#E8F5E8"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <rect x="${w * 0.08}" y="${h * 0.12}" width="${w * 0.84}" height="${h * 0.62}" rx="24" fill="#ffffff" stroke="${accent}" stroke-width="6"/>
  <text x="${w / 2}" y="${h * 0.42}" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="800" font-size="${Math.min(48, w * 0.06)}" fill="${brand.ink}">${label}</text>
  <text x="${w / 2}" y="${h * 0.88}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="${Math.max(18, w * 0.028)}" fill="#9E9589">Placeholder · Replace with product shots</text>
</svg>`;
}

async function main() {
  ensureDir(pub('icons'));
  ensureDir(pub('og'));
  ensureDir(pub('videos'));
  ensureDir(pub('screenshots'));
  ensureDir(pub('startup'));

  const iconSizes = [32, 72, 96, 128, 144, 152, 192, 384, 512];
  const svgH = iconSvg('H', brand.orange, { radius: 96 });
  const svgMask = iconSvg('H', brand.orange, { radius: 128 });

  for (const s of iconSizes) {
    await writePngFromSvg(svgH, pub('icons', `icon-${s}x${s}.png`), s, s);
  }

  for (const s of [192, 384, 512]) {
    await writePngFromSvg(svgMask, pub('icons', `maskable-icon-${s}x${s}.png`), s, s);
  }

  await writePngFromSvg(svgH, pub('icons', 'apple-touch-icon.png'), 180, 180);
  await writePngFromSvg(svgH, pub('icons', 'notification-icon.png'), 192, 192);
  await writePngFromSvg(iconSvg('H', brand.orange), pub('icons', 'badge-72x72.png'), 72, 72);

  const shortcuts = [
    { file: 'shortcut-order-96x96.png', letter: 'O', bg: brand.orange },
    { file: 'shortcut-scan-96x96.png', letter: 'S', bg: brand.teal },
    { file: 'shortcut-wallet-96x96.png', letter: 'W', bg: brand.green },
    { file: 'shortcut-emergency-96x96.png', letter: '!', bg: brand.red },
  ];
  for (const { file, letter, bg } of shortcuts) {
    await writePngFromSvg(iconSvg(letter, bg, { radius: 72 }), pub('icons', file), 96, 96);
  }

  const og = ogWideSvg();
  await writePngFromSvg(og, pub('og', 'home.png'), 1200, 630);
  await writePngFromSvg(og, pub('og', 'default.png'), 1200, 630);
  await writePngFromSvg(og, pub('og', 'twitter.png'), 1200, 630);
  await writePngFromSvg(ogSquareSvg(), pub('og', 'square.png'), 1200, 1200);

  await writeJpegFromSvg(ogWideSvg(), pub('videos', 'how-to-order-poster.jpg'), 1280, 720);

  await writePngFromSvg(
    screenshotSvg(390, 844, 'Order meals', brand.orange),
    pub('screenshots', 'mobile-1.png'),
    390,
    844
  );
  await writePngFromSvg(
    screenshotSvg(390, 844, 'RFID pickup', brand.teal),
    pub('screenshots', 'mobile-2.png'),
    390,
    844
  );
  await writePngFromSvg(
    screenshotSvg(1024, 768, 'Dashboard', brand.green),
    pub('screenshots', 'desktop-1.png'),
    1024,
    768
  );

  const startup = [
    ['iphone5.png', 640, 1136],
    ['iphone6.png', 750, 1334],
    ['iphoneplus.png', 1242, 2208],
    ['iphonex.png', 1125, 2436],
    ['iphonexr.png', 828, 1792],
    ['iphonexsmax.png', 1242, 2688],
    ['ipad.png', 1536, 2048],
  ];
  for (const [name, w, h] of startup) {
    await writePngFromSvg(splashSvg(w, h), pub('startup', name), w, h);
  }

  await fs.promises.copyFile(pub('icons', 'icon-32x32.png'), pub('favicon.ico'));

  // eslint-disable-next-line no-console
  console.log('generate-public-assets: wrote PNG/JPEG under public/ (icons, og, videos, screenshots, startup, favicon.ico)');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
