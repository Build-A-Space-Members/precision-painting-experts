// Generates docs/url-map.md and docs/keyword-map.md from the content files and the
// original sitemap inventory (content/PATHS.txt + src/data/archives.json).
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const site = require('../src/data/site');
const archives = require('../src/data/archives.json');

const pages = fs.readdirSync(path.join(root, 'content', 'pages')).filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(root, 'content', 'pages', f), 'utf8')));
const byPath = Object.fromEntries(pages.map((p) => [p.path, p]));
const order = fs.readFileSync(path.join(root, 'content', 'PATHS.txt'), 'utf8').trim().split('\n');
const md = (s) => String(s || '').replace(/\|/g, '\\|');

const urlRows = order.map((p) => {
  const pg = byPath[p];
  return `| ${p} | ${site.url}${p === '/' ? '/' : p} | ${pg ? pg.type : 'MISSING'} | 200, indexable | ${md(pg && pg.title)} |`;
}).concat(archives.map((a) => `| ${a.path} | ${site.url}${a.path} | ${a.kind} archive | 200, noindex,follow | ${a.posts.length} post(s) |`));
fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
fs.writeFileSync(path.join(root, 'docs', 'url-map.md'), `# Original → rebuilt URL map

Every URL from the original sitemap (${order.length + archives.length} URLs) is preserved at the same path on the same domain,
with no trailing slash, matching the original. Legacy redirects kept: \`/services/<slug>\` → \`/<slug>\` (301, as on the
original site), plus \`/locations/<city>\` → \`/locations/<county>/<city>\` (301; the original referenced these URLs in its
structured data, but they returned 404). Trailing-slash and \`.html\` variants 301 to the clean URL.

| Original path | Rebuilt URL | Type | Status | Title / notes |
|---|---|---|---|---|
${urlRows.join('\n')}
`);

const kwRows = order.map((p) => byPath[p]).filter(Boolean).map((p) =>
  `| ${p.path} | ${p.type} | ${md(p.keywords && p.keywords.primary)} | ${md(((p.keywords && p.keywords.secondary) || []).join('; '))} | ${md(((p.keywords && p.keywords.questions) || []).join(' / '))} |`);
const prim = pages.map((p) => (p.keywords && p.keywords.primary || '').toLowerCase().trim());
const dupes = prim.filter((k, i) => k && prim.indexOf(k) !== i);
fs.writeFileSync(path.join(root, 'docs', 'keyword-map.md'), `# Page-level keyword map

These are proposed keyword targets chosen editorially from each page's search intent. **No search volumes or rankings
were measured** — validate priorities with Google Search Console / a keyword tool after launch.
Each indexable page has one distinct primary keyword (duplicates found: ${dupes.length ? dupes.join(', ') : 'none'}).

| Path | Type | Primary keyword | Secondary keywords | Questions answered |
|---|---|---|---|---|
${kwRows.join('\n')}
`);
console.log(`url-map: ${urlRows.length} rows · keyword-map: ${kwRows.length} rows · duplicate primaries: ${dupes.length}`);
