// Validates the built site in dist/: titles, descriptions, H1s, canonicals, robots, JSON-LD,
// internal links, image alt text, sitemap coverage, and orphan pages.
// Usage: npm run build && node scripts/seo-check.js
const fs = require('fs');
const path = require('path');
const site = require('../src/data/site');

const dist = path.join(__dirname, '..', 'dist');
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (f.endsWith('.html')) files.push(f); } })(dist);

const toPath = (f) => { const r = '/' + path.relative(dist, f).replace(/\\/g, '/').replace(/\.html$/, ''); return r === '/index' ? '/' : r; };
const exists = new Set(files.map(toPath));
const redirectsOk = (p) => /^\/services\/[a-z0-9-]+$/.test(p) && exists.has('/' + p.split('/')[2]);
const errors = []; const warns = [];
const err = (p, m) => errors.push(`${p}: ${m}`);
const warn = (p, m) => warns.push(`${p}: ${m}`);
const titles = new Map(); const descs = new Map();
const inbound = new Map();
const indexable = [];

for (const f of files) {
  const p = toPath(f);
  if (p === '/404') continue;
  const html = fs.readFileSync(f, 'utf8');
  const get = (re) => (html.match(re) || [])[1];
  const title = get(/<title>([^<]*)<\/title>/);
  const desc = get(/<meta name="description" content="([^"]*)"/);
  const canon = get(/<link rel="canonical" href="([^"]*)"/);
  const robots = get(/<meta name="robots" content="([^"]*)"/) || '';
  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  const isIndex = robots.startsWith('index');
  if (isIndex) indexable.push(p);
  if (!title) err(p, 'missing <title>');
  else {
    const t = title.replace(/&amp;/g, '&');
    if (isIndex && (t.length < 25 || t.length > 65)) warn(p, `title length ${t.length}`);
    if (titles.has(t)) err(p, `duplicate title with ${titles.get(t)}`); else titles.set(t, p);
  }
  if (!desc) err(p, 'missing meta description');
  else {
    if (isIndex && (desc.length < 110 || desc.length > 165)) warn(p, `description length ${desc.length}`);
    if (descs.has(desc)) err(p, `duplicate description with ${descs.get(desc)}`); else descs.set(desc, p);
  }
  if (h1s !== 1) err(p, `${h1s} <h1> elements`);
  const expected = site.url + (p === '/' ? '/' : p);
  if (canon !== expected) err(p, `canonical ${canon} ≠ ${expected}`);
  if (!/(index|noindex), (follow|nofollow)/.test(robots)) err(p, `robots "${robots}"`);
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch (e) { err(p, 'invalid JSON-LD'); } }
  if (isIndex && !html.includes('application/ld+json')) warn(p, 'no structured data');
  for (const m of html.matchAll(/<img\b[^>]*>/g)) if (!/\salt="/.test(m[0])) err(p, 'img without alt');
  // internal links
  for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) {
    const href = m[1];
    if (/^\/(css|js|img|agent|favicon|apple-touch|icon-|site\.webmanifest|sitemap\.xml)/.test(href)) continue;
    const clean = href.length > 1 ? href.replace(/\/$/, '') : href;
    if (!exists.has(clean) && !redirectsOk(clean)) err(p, `broken link ${href}`);
    if (clean !== p) { if (!inbound.has(clean)) inbound.set(clean, new Set()); inbound.get(clean).add(p); }
  }
  if (/lorem ipsum|TODO|\{\{|undefined|\[object Object\]|NaN/.test(html.replace(/<script[\s\S]*?<\/script>/g, ''))) err(p, 'placeholder/undefined text');
}

// sitemap
const sm = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
const smUrls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(site.url, '') || '/');
const smSet = new Set(smUrls);
for (const p of indexable) if (!smSet.has(p)) err(p, 'indexable but missing from sitemap');
for (const u of smUrls) if (!indexable.includes(u)) err(u, 'in sitemap but not indexable/present');
// orphans
for (const p of indexable) if (p !== '/' && !(inbound.get(p) && inbound.get(p).size)) err(p, 'orphan (no internal links point here)');
const weak = indexable.filter((p) => p !== '/' && inbound.get(p) && inbound.get(p).size < 3);
// robots.txt
const robotsTxt = fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8');
const staging = JSON.parse(fs.readFileSync(path.join(dist, 'build.json'), 'utf8')).staging;
if (!staging && /Disallow: \/\s*$/m.test(robotsTxt)) err('robots.txt', 'production build blocks all crawling');

console.log(`Checked ${files.length - 1} HTML pages · ${indexable.length} indexable · ${smUrls.length} sitemap URLs${staging ? ' · STAGING BUILD' : ''}`);
console.log(`Pages with fewer than 3 internal referring pages: ${weak.length}`);
if (warns.length) { console.log(`\nWarnings (${warns.length}):`); warns.slice(0, 40).forEach((w) => console.log('  ' + w)); }
if (errors.length) { console.log(`\nErrors (${errors.length}):`); errors.slice(0, 80).forEach((e) => console.log('  ' + e)); process.exitCode = 1; } else console.log('\nNo errors.');
