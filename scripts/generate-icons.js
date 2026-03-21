/**
 * Génère les icônes PNG à partir du SVG icon.
 * Usage: node scripts/generate-icons.js
 *
 * Prérequis: npm install -g sharp-cli
 * Ou utiliser un outil en ligne : https://svgtopng.com
 *
 * Ce script documente les tailles nécessaires.
 * En attendant sharp, les SVG fonctionnent directement dans les navigateurs modernes.
 */

console.log(`
Skilluv — Icon generation guide
================================

Source SVG: static/icon.svg

Required PNG exports:
  - static/favicon.png      → 32x32
  - static/icon-192.png     → 192x192 (PWA)
  - static/icon-512.png     → 512x512 (PWA)

Quick generation with sharp-cli:
  npx sharp -i static/icon.svg -o static/favicon.png resize 32 32
  npx sharp -i static/icon.svg -o static/icon-192.png resize 192 192
  npx sharp -i static/icon.svg -o static/icon-512.png resize 512 512

Or use Inkscape CLI:
  inkscape static/icon.svg -w 32 -h 32 -o static/favicon.png
  inkscape static/icon.svg -w 192 -h 192 -o static/icon-192.png
  inkscape static/icon.svg -w 512 -h 512 -o static/icon-512.png

The SVG files work directly in all modern browsers.
`);
