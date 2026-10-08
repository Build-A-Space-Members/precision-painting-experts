// Static build: content/pages/*.json + templates → dist/
//   SITE_ENV=staging npm run build   → every page noindex (use for previews)
//   npm run build                    → production (indexable)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const site = require('./data/site');
const postsMeta = require('./data/posts-meta.json');
const archives = require('./data/archives.json');
const { render, renderArchive, render404 } = require('./templates/pages');
const { imageFor } = require('./templates/components');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const STAGING = process.env.SITE_ENV === 'staging';
const hash = (buf) => crypto.createHash('sha1').update(buf).digest('hex').slice(0, 10);

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, e.name); const d = path.join(to, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}
function writePage(urlPath, html) {
  const file = urlPath === '/' ? path.join(dist, 'index.html') : path.join(dist, urlPath.slice(1) + '.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}
const slugify = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function main() {
  fs.rmSync(dist, { recursive: true, force: true });
  copyDir(path.join(root, 'public'), dist);

  // Fingerprint CSS/JS so they can be cached for a year.
  const assets = {};
  for (const [key, rel] of [['css', 'css/site.css'], ['js', 'js/site.js'], ['agentJs', 'js/agent-tools.js']]) {
    const buf = fs.readFileSync(path.join(dist, rel));
    const out = rel.replace(/\.(css|js)$/, `.${hash(buf)}.$1`);
    fs.renameSync(path.join(dist, rel), path.join(dist, out));
    assets[key] = '/' + out;
  }

  // Load content
  const pages = {};
  for (const f of fs.readdirSync(path.join(root, 'content', 'pages')).filter((x) => x.endsWith('.json'))) {
    const p = JSON.parse(fs.readFileSync(path.join(root, 'content', 'pages', f), 'utf8'));
    pages[p.path] = p;
  }
  const services = {};
  for (const slug of [...site.coreServices, ...site.commercialServices, ...site.specialtyServices]) {
    const p = pages['/' + slug];
    if (p) services[slug] = { navLabel: p.navLabel || p.h1, card: p.card || p.heroIntro || p.description };
  }

  // Blog metadata (dates/categories/tags preserved from the original site)
  const archiveByPath = Object.fromEntries(archives.map((a) => [a.path, a]));
  const postMeta = {};
  const posts = [];
  for (const [slug, m] of Object.entries(postsMeta)) {
    const p = '/' + slug;
    const page = pages[p];
    if (!page) continue;
    const d = new Date(m.meta.Published + ' 12:00 UTC');
    const catPath = m.links.find((l) => l.startsWith('/category/')) || `/category/${slugify(m.meta.Category)}`;
    const meta = {
      date: d.toISOString().slice(0, 10), dateLabel: m.meta.Published, category: m.meta.Category, categoryPath: catPath,
      tags: m.links.filter((l) => l.startsWith('/tag/') && archiveByPath[l]).map((l) => ({ path: l, name: (archiveByPath[l] || {}).name || l.split('/').pop() })),
      img: imageFor(slug)
    };
    postMeta[p] = meta;
    posts.push({ path: p, h1: page.h1, excerpt: page.excerpt, description: page.description, category: meta.category, date: meta.date, dateLabel: meta.dateLabel, img: meta.img });
  }
  posts.sort((a, b) => b.date.localeCompare(a.date));
  const postsByPath = Object.fromEntries(posts.map((p) => [p.path, p]));
  const categories = archives.filter((a) => a.kind === 'category' && a.posts.length).map((a) => ({ path: a.path, name: a.name }));
  const compare = Object.values(pages).filter((p) => p.type === 'compare').sort((a, b) => a.h1.localeCompare(b.h1));

  // Agent catalog for WebMCP tools (same content the pages render from)
  const strip = (s = '') => String(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const catalog = {
    business: { name: site.name, phone: site.phone, email: site.email, hours: 'Mon–Fri 9:00 AM – 6:30 PM; closed Sat & Sun', basedIn: `${site.city}, ${site.region} ${site.zip}`, contactPage: '/contact-us', requestPage: '/get-a-free-quote', pricing: 'No published prices. Free written, itemized estimates after a walkthrough; price depends on measured area, surface condition and prep, product line, access, and number of colors.' },
    services: Object.entries(services).map(([slug, s]) => {
      const p = pages['/' + slug];
      return { slug, name: s.navLabel, summary: strip(s.card), keywords: [p.keywords && p.keywords.primary, ...((p.keywords && p.keywords.secondary) || [])].filter(Boolean), includes: (p.sections || []).flatMap((x) => x.bullets || []).slice(0, 8).map(strip), faqs: (p.faqs || []).slice(0, 3).map((f) => ({ q: strip(f.q), a: strip(f.a) })), page: '/' + slug };
    }),
    serviceArea: {
      counties: site.counties.map((c) => ({ name: c.name, page: `/locations/${c.slug}` })),
      cities: site.cities.map((c) => ({ name: c.name, state: 'FL', county: site.counties.find((k) => k.slug === c.county).name, zips: [c.zip], page: `/locations/${c.county}/${c.slug}`, servicesPage: `/${c.slug}-fl-painting-services` }))
    },
    articles: posts.map((p) => ({ title: p.h1, summary: strip(p.excerpt || p.description), category: p.category, date: p.date, page: p.path })),
    pages: Object.values(pages).filter((p) => p.type === 'core').map((p) => ({ title: p.h1, summary: strip(p.description), page: p.path }))
  };
  const catJson = JSON.stringify(catalog);
  fs.mkdirSync(path.join(dist, 'agent'), { recursive: true });
  assets.catalog = `/agent/catalog.${hash(catJson)}.json`;
  fs.writeFileSync(path.join(dist, assets.catalog), catJson);

  const ctx = { pages, services, posts, postsByPath, postMeta, categories, compare, assets, robots: STAGING ? 'noindex, nofollow' : 'index, follow, max-image-preview:large' };

  // Render
  let count = 0;
  for (const page of Object.values(pages)) { writePage(page.path, render(page, ctx)); count++; }
  for (const a of archives) { writePage(a.path, renderArchive(a, ctx)); count++; }
  fs.writeFileSync(path.join(dist, '404.html'), render404(ctx));

  // Sitemap: canonical, indexable pages only (archives are noindex)
  const today = new Date().toISOString().slice(0, 10);
  const urls = Object.values(pages).map((p) => `<url><loc>${site.url}${p.path === '/' ? '/' : p.path}</loc><lastmod>${postMeta[p.path] ? postMeta[p.path].date : today}</lastmod></url>`);
  fs.writeFileSync(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
  fs.writeFileSync(path.join(dist, 'robots.txt'), STAGING
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${site.url}/sitemap.xml\n`);
  fs.writeFileSync(path.join(dist, 'site.webmanifest'), JSON.stringify({ name: site.name, short_name: 'Precision Paint', icons: [{ src: '/icon-512.png', sizes: '512x512', type: 'image/png' }, { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }], theme_color: '#0f1f38', background_color: '#ffffff', display: 'browser' }));
  fs.writeFileSync(path.join(dist, 'build.json'), JSON.stringify({ builtAt: new Date().toISOString(), staging: STAGING, pages: count, sitemapUrls: urls.length }));
  console.log(`Built ${count} pages (${urls.length} in sitemap)${STAGING ? ' [STAGING: noindex]' : ''} → dist/`);
}

main();
