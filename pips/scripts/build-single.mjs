// Inline the Vite build into one HTML body fragment for a claude.ai Artifact
// preview (the Artifact host supplies <html>/<head>/<body> itself).
// Usage: npm run build && node scripts/build-single.mjs [out]
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const out = process.argv[2] ?? join(dist, 'pips-single.html');
const html = readFileSync(join(dist, 'index.html'), 'utf8');

const title = html.match(/<title>.*?<\/title>/s)?.[0] ?? '<title>Pips</title>';
const fonts = [...html.matchAll(/<link rel="(?:stylesheet|preconnect)"[^>]*>/g)].map((m) => m[0]).filter((l) => l.includes('fonts.g'));
const cssHref = html.match(/<link rel="stylesheet" crossorigin href="\.\/(assets\/[^"]+\.css)">/)?.[1];
const jsSrc = html.match(/<script type="module" crossorigin src="\.\/(assets\/[^"]+\.js)"><\/script>/)?.[1];
if (!cssHref || !jsSrc) throw new Error('could not find built CSS/JS in dist/index.html');
const css = readFileSync(join(dist, cssHref), 'utf8');
const js = readFileSync(join(dist, jsSrc), 'utf8').replace(/<\/script/gi, '<\\/script');

writeFileSync(out, [title, ...fonts, `<style>${css}</style>`, '<div id="root"></div>', `<script type="module">${js}</script>`, ''].join('\n'));
console.log(`wrote ${out} (${Math.round((css.length + js.length) / 1024)} KB)`);
