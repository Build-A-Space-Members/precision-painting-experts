// Cross-page content uniqueness review.
// Method: main-body text of each page (hero intro, section headings/paragraphs/bullets, FAQs —
// excluding shared header/footer/CTA chrome) is lowercased, stripped of HTML and punctuation, and
// split into overlapping 5-word shingles. For every page we report:
//   unique  = share of its shingles that appear on NO other page (target ≥ 80%)
//   maxJac  = highest Jaccard similarity to any single other page (and which one)
// Usage: node scripts/similarity.js [--min 0.8] [--json out.json] [--source dir]
//   --source <dir> also compares each page with the original site's text (<key>.txt files).
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const MIN = parseFloat(opt('--min', '0.8'));
const N = 5;
const dir = path.join(__dirname, '..', 'content', 'pages');

const clean = (s) => String(s || '').replace(/<[^>]+>/g, ' ').toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
const shingles = (text) => {
  const w = clean(text).split(' ').filter(Boolean);
  const set = new Set();
  for (let i = 0; i + N <= w.length; i++) set.add(w.slice(i, i + N).join(' '));
  return set;
};
const bodyText = (p) => [p.heroIntro, ...(p.sections || []).flatMap((s) => [s.h2, ...(s.body || []), ...(s.bullets || [])]), ...(p.faqs || []).flatMap((f) => [f.q, f.a])].join(' \n ');

const pages = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => {
  const p = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  return { key: f.replace(/\.json$/, ''), path: p.path, type: p.type, sh: shingles(bodyText(p)), words: clean(bodyText(p)).split(' ').length };
});

// shingle → number of pages containing it
const df = new Map();
for (const p of pages) for (const s of p.sh) df.set(s, (df.get(s) || 0) + 1);

const results = pages.map((p) => {
  let uniq = 0;
  for (const s of p.sh) if (df.get(s) === 1) uniq++;
  let maxJ = 0; let maxWith = '';
  for (const q of pages) {
    if (q === p) continue;
    let inter = 0;
    const [a, b] = p.sh.size < q.sh.size ? [p.sh, q.sh] : [q.sh, p.sh];
    for (const s of a) if (b.has(s)) inter++;
    const j = inter / (p.sh.size + q.sh.size - inter || 1);
    if (j > maxJ) { maxJ = j; maxWith = q.path; }
  }
  return { path: p.path, type: p.type, words: p.words, unique: p.sh.size ? uniq / p.sh.size : 0, maxJac: maxJ, maxWith };
});

const src = opt('--source');
if (src) {
  for (const r of results) {
    const key = r.path === '/' ? 'index' : r.path.slice(1).replace(/\//g, '_');
    const f = path.join(src, key + '.txt');
    if (!fs.existsSync(f)) continue;
    const s = shingles(fs.readFileSync(f, 'utf8').split('\n').slice(4).join(' ').replace(/\[[a-z0-9]+\]/g, ' '));
    const mine = pages.find((p) => p.path === r.path).sh;
    let inter = 0; for (const x of mine) if (s.has(x)) inter++;
    r.sharedWithOriginal = mine.size ? inter / mine.size : 0;
  }
}

results.sort((a, b) => a.unique - b.unique);
const below = results.filter((r) => r.unique < MIN);
const avg = results.reduce((t, r) => t + r.unique, 0) / results.length;
const byType = {};
for (const r of results) { (byType[r.type] = byType[r.type] || []).push(r.unique); }
console.log(`Pages: ${results.length} · 5-word shingles · target unique ≥ ${(MIN * 100).toFixed(0)}%`);
console.log(`Average unique share: ${(avg * 100).toFixed(1)}% · lowest: ${(results[0].unique * 100).toFixed(1)}% (${results[0].path})`);
for (const [t, v] of Object.entries(byType)) console.log(`  ${t.padEnd(12)} n=${String(v.length).padStart(3)}  min ${(Math.min(...v) * 100).toFixed(1)}%  avg ${(v.reduce((a, b) => a + b, 0) / v.length * 100).toFixed(1)}%`);
const topJ = results.slice().sort((a, b) => b.maxJac - a.maxJac).slice(0, 5);
console.log('Highest pairwise Jaccard:'); topJ.forEach((r) => console.log(`  ${(r.maxJac * 100).toFixed(1)}%  ${r.path} ↔ ${r.maxWith}`));
if (src) {
  const o = results.filter((r) => r.sharedWithOriginal !== undefined);
  const mx = o.slice().sort((a, b) => b.sharedWithOriginal - a.sharedWithOriginal)[0];
  console.log(`Overlap with original site text: avg ${(o.reduce((t, r) => t + r.sharedWithOriginal, 0) / o.length * 100).toFixed(1)}%, max ${(mx.sharedWithOriginal * 100).toFixed(1)}% (${mx.path})`);
}
if (below.length) { console.log(`\n${below.length} page(s) below target:`); below.forEach((r) => console.log(`  ${(r.unique * 100).toFixed(1)}%  ${r.path}  (closest: ${r.maxWith}, J=${(r.maxJac * 100).toFixed(1)}%)`)); }
const out = opt('--json');
if (out) fs.writeFileSync(out, JSON.stringify(results, null, 1));
process.exitCode = below.length ? 1 : 0;
