const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.join(__dirname, 'public');
const iconsDir = path.join(publicDir, 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 1. Standard icon SVG (for 192x192, 512x512, apple-touch-icon)
const standardSvg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="112" fill="#1C1B1F"/>
  <!-- PUZO Accent Container -->
  <rect x="32" y="32" width="448" height="448" rx="80" fill="url(#puzoGrad)"/>
  <!-- OLED Display Screen -->
  <rect x="80" y="112" width="352" height="288" rx="44" fill="#09080C" stroke="#4A4458" stroke-width="6"/>
  <!-- PUZO Eyes (Curious & Cute) -->
  <!-- Left Eye -->
  <ellipse cx="180" cy="236" rx="36" ry="52" fill="#FFFFFF"/>
  <ellipse cx="192" cy="224" rx="14" ry="20" fill="#6750A4"/>
  <!-- Right Eye -->
  <ellipse cx="332" cy="236" rx="36" ry="52" fill="#FFFFFF"/>
  <ellipse cx="344" cy="224" rx="14" ry="20" fill="#6750A4"/>
  <!-- Cute Smile -->
  <path d="M 224 324 Q 256 352 288 324" fill="none" stroke="#E6E0E9" stroke-width="12" stroke-linecap="round"/>
  <defs>
    <linearGradient id="puzoGrad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#7D5260"/>
      <stop offset="50%" stop-color="#6750A4"/>
      <stop offset="100%" stop-color="#4F378B"/>
    </linearGradient>
  </defs>
</svg>`;

// 2. Maskable icon SVG (full bleed background for Android dynamic clipping)
const maskableSvg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#6750A4"/>
  <!-- Safe Zone Content (Inner 80% / 409x409) -->
  <!-- OLED Display Screen -->
  <rect x="80" y="112" width="352" height="288" rx="44" fill="#09080C" stroke="#D0BCFF" stroke-width="6"/>
  <!-- PUZO Eyes -->
  <ellipse cx="180" cy="236" rx="36" ry="52" fill="#FFFFFF"/>
  <ellipse cx="192" cy="224" rx="14" ry="20" fill="#6750A4"/>
  <ellipse cx="332" cy="236" rx="36" ry="52" fill="#FFFFFF"/>
  <ellipse cx="344" cy="224" rx="14" ry="20" fill="#6750A4"/>
  <!-- Cute Smile -->
  <path d="M 224 324 Q 256 352 288 324" fill="none" stroke="#E6E0E9" stroke-width="12" stroke-linecap="round"/>
</svg>`;

async function generate() {
  const stdBuf = Buffer.from(standardSvg);
  const maskBuf = Buffer.from(maskableSvg);

  // 192x192 icon
  await sharp(stdBuf).resize(192, 192).toFile(path.join(iconsDir, 'icon-192.png'));
  console.log('Created icon-192.png');

  // 512x512 icon
  await sharp(stdBuf).resize(512, 512).toFile(path.join(iconsDir, 'icon-512.png'));
  console.log('Created icon-512.png');

  // 512x512 maskable icon
  await sharp(maskBuf).resize(512, 512).toFile(path.join(iconsDir, 'maskable-icon-512.png'));
  console.log('Created maskable-icon-512.png');

  // 180x180 Apple touch icon
  await sharp(stdBuf).resize(180, 180).toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // Favicon (32x32 ico/png)
  await sharp(stdBuf).resize(32, 32).toFile(path.join(publicDir, 'favicon.ico'));
  console.log('Created favicon.ico');
}

generate().catch(console.error);
