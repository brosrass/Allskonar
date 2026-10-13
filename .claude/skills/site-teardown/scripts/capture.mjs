#!/usr/bin/env node
// Clean-room site capture: screenshots + derived facts only. Never stores the
// target's JS/CSS/HTML source.
//
// Usage: node capture.mjs <start-url> [--out dir] [--max-pages 40] [--delay 1500]
//                                     [--no-robots] [--mobile-only|--desktop-only]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {
    const root = execSync('npm root -g').toString().trim();
    return createRequire(join(root, 'noop.js'))('playwright');
  }
}

function parseArgs(argv) {
  const a = { out: null, maxPages: 40, delay: 1500, robots: true, desktop: true, mobile: true };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--out') a.out = argv[++i];
    else if (k === '--max-pages') a.maxPages = Number(argv[++i]);
    else if (k === '--delay') a.delay = Math.max(500, Number(argv[++i]));
    else if (k === '--no-robots') a.robots = false;
    else if (k === '--mobile-only') a.desktop = false;
    else if (k === '--desktop-only') a.mobile = false;
    else rest.push(k);
  }
  if (!rest[0]) {
    console.error('usage: capture.mjs <start-url> [--out dir] [--max-pages N] [--delay ms]');
    process.exit(2);
  }
  a.start = new URL(rest[0]);
  a.out ??= join('teardown', a.start.hostname.replace(/^www\./, ''));
  return a;
}

// Minimal robots.txt: Disallow rules for User-agent: * only.
async function loadRobots(origin) {
  try {
    const res = await fetch(new URL('/robots.txt', origin));
    if (!res.ok) return [];
    const lines = (await res.text()).split(/\r?\n/);
    const rules = [];
    let applies = false;
    for (const raw of lines) {
      const line = raw.replace(/#.*/, '').trim();
      const [key, ...v] = line.split(':');
      const val = v.join(':').trim();
      if (/^user-agent$/i.test(key)) applies = val === '*';
      else if (applies && /^disallow$/i.test(key) && val) rules.push(val);
    }
    return rules;
  } catch {
    return [];
  }
}

// Third-party host classification. Heuristic; output is tagged [INFERRED].
const CATEGORIES = [
  ['ads', /doubleclick|googlesyndication|adservice|adnxs|amazon-adsystem|criteo|pubmatic|rubicon|openx|taboola|outbrain|prebid|adsafeprotected|moatads|ezoic|mediavine|freestar|playwire|venatus/i],
  ['consent', /cookiebot|onetrust|quantcast|consensu|didomi|usercentrics|fundingchoices/i],
  ['analytics', /google-analytics|googletagmanager|gtag|clarity\.ms|hotjar|plausible|segment|mixpanel|amplitude|matomo|cloudflareinsights/i],
  ['cdn', /cloudflare|cloudfront|fastly|akamai|jsdelivr|unpkg|cdnjs|bunny/i],
  ['fonts', /fonts\.(googleapis|gstatic)|typekit|fontawesome/i],
  ['realtime', /socket|pusher|ably|firebase|supabase|signalr|colyseus/i],
];
const categorize = (host) => CATEGORIES.find(([, re]) => re.test(host))?.[0] ?? 'other';

const slugify = (u) =>
  (u.pathname.replace(/\/+$/, '') || '/home').replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'home';

// Runs in the page. Returns derived facts only.
function extract() {
  const txt = (el) => el.textContent.replace(/\s+/g, ' ').trim();
  const count = (sel) => document.querySelectorAll(sel).length;
  const colors = {};
  const fonts = {};
  const bump = (m, k) => k && (m[k] = (m[k] || 0) + 1);
  for (const el of document.querySelectorAll('body, body *')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el);
    if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)') bump(colors, 'bg ' + cs.backgroundColor);
    if (el.childNodes.length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) {
      bump(colors, 'fg ' + cs.color);
      bump(fonts, `${cs.fontFamily.split(',')[0].replace(/["']/g, '')} ${cs.fontWeight} ${cs.fontSize}`);
    }
  }
  const top = (m, n) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n);
  return {
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content ?? null,
    canonical: document.querySelector('link[rel="canonical"]')?.href ?? null,
    hreflang: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => l.hreflang),
    lang: document.documentElement.lang || null,
    headings: [...document.querySelectorAll('h1,h2,h3')].slice(0, 40).map((h) => `${h.tagName} ${txt(h)}`),
    nav: [...document.querySelectorAll('nav a, header a')].slice(0, 80).map((a) => ({ text: txt(a), href: a.href })),
    links: [...new Set([...document.querySelectorAll('a[href]')].map((a) => a.href))],
    jsonLdTypes: [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap((s) => {
      try { const j = JSON.parse(s.textContent); return [].concat(j).map((x) => x['@type']); } catch { return []; }
    }),
    dom: {
      elements: count('*'), canvas: count('canvas'), svg: count('svg'), img: count('img'),
      iframes: count('iframe'), buttons: count('button'), dialogs: count('dialog,[role="dialog"]'),
    },
    viewport: { w: innerWidth, h: innerHeight, scrollH: document.documentElement.scrollHeight },
    topColors: top(colors, 15),
    topFonts: top(fonts, 12),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { chromium, devices } = await loadPlaywright();
  const screens = join(args.out, 'capture', 'screens');
  mkdirSync(screens, { recursive: true });

  const disallow = args.robots ? await loadRobots(args.start.origin) : [];
  const allowed = (u) => !disallow.some((p) => u.pathname.startsWith(p));

  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const ctxs = [];
  if (args.desktop) ctxs.push(['desktop', await browser.newContext({ viewport: { width: 1366, height: 900 } })]);
  if (args.mobile) ctxs.push(['mobile', await browser.newContext({ ...devices['iPhone 13'] })]);

  const queue = [args.start.href];
  const seen = new Set();
  const pages = [];
  const thirdParty = {};

  while (queue.length && pages.length < args.maxPages) {
    const url = new URL(queue.shift());
    url.hash = '';
    if (seen.has(url.href)) continue;
    seen.add(url.href);
    if (!allowed(url)) { console.log('robots skip', url.href); continue; }

    const slug = slugify(url);
    let facts = null;
    for (const [label, ctx] of ctxs) {
      const page = await ctx.newPage();
      page.on('request', (req) => {
        try {
          const h = new URL(req.url()).hostname;
          if (h && h !== args.start.hostname && !h.endsWith('.' + args.start.hostname.replace(/^www\./, ''))) {
            thirdParty[h] ??= { category: categorize(h), types: new Set() };
            thirdParty[h].types.add(req.resourceType());
          }
        } catch {}
      });
      try {
        await page.goto(url.href, { waitUntil: 'networkidle', timeout: 30000 });
      } catch (e) {
        console.warn(`load warning ${url.href} (${label}): ${e.message.split('\n')[0]}`);
      }
      await page.screenshot({ path: join(screens, `${slug}-${label}.png`), fullPage: label === 'desktop' });
      if (!facts) facts = await page.evaluate(extract).catch((e) => ({ error: e.message }));
      await page.close();
    }
    pages.push({ url: url.href, slug, ...facts, links: undefined });
    for (const l of facts?.links ?? []) {
      try {
        const n = new URL(l);
        if (n.origin === args.start.origin && !seen.has(n.href.split('#')[0])) queue.push(n.href);
      } catch {}
    }
    console.log(`[${pages.length}/${args.maxPages}] ${url.href}`);
    await new Promise((r) => setTimeout(r, args.delay));
  }
  await browser.close();

  const tp = Object.fromEntries(Object.entries(thirdParty).map(([h, v]) => [h, { category: v.category, types: [...v.types] }]));
  const out = join(args.out, 'capture');
  writeFileSync(join(out, 'pages.json'), JSON.stringify({ start: args.start.href, capturedAt: new Date().toISOString(), robotsDisallow: disallow, pages, thirdParty: tp }, null, 2));

  const agg = (key) => {
    const m = {};
    for (const p of pages) for (const [k, n] of p[key] ?? []) m[k] = (m[k] || 0) + n;
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 12);
  };
  const byCat = {};
  for (const [h, v] of Object.entries(tp)) (byCat[v.category] ??= []).push(h);
  const md = [
    `# Capture summary: ${args.start.hostname}`, '',
    `Captured ${pages.length} pages on ${new Date().toISOString().slice(0, 10)}. Facts below are [OBSERVED] unless tagged.`, '',
    '## Pages', '', '| Slug | Title | H1 | canvas | svg |', '|---|---|---|---|---|',
    ...pages.map((p) => `| ${p.slug} | ${(p.title ?? '').replace(/\|/g, '/')} | ${(p.headings?.find((h) => h.startsWith('H1')) ?? '').slice(3).replace(/\|/g, '/')} | ${p.dom?.canvas ?? ''} | ${p.dom?.svg ?? ''} |`),
    '', '## Top colours (computed, by element count)', '', ...agg('topColors').map(([k, n]) => `- \`${k}\` × ${n}`),
    '', '## Top text styles', '', ...agg('topFonts').map(([k, n]) => `- \`${k}\` × ${n}`),
    '', '## Third-party hosts [INFERRED category]', '',
    ...Object.entries(byCat).map(([c, hs]) => `- **${c}**: ${hs.sort().join(', ')}`), '',
  ].join('\n');
  writeFileSync(join(out, 'summary.md'), md);
  console.log(`done → ${out}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
