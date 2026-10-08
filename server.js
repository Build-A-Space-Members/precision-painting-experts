// Production server for the static build in dist/.
//   npm run build && npm start
// Env:
//   PORT               listen port (default 3000)
//   SITE_ENV=staging   adds X-Robots-Tag: noindex to every response
//   CANONICAL_HOST     e.g. precisionpaintexperts.com — redirects other hosts (www, etc.) here with HTTPS
//   FORM_WEBHOOK_URL   where estimate requests are POSTed as JSON (Zapier/Make/CRM/email relay)
const express = require('express');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const site = require('./src/data/site');

const app = express();
const PORT = process.env.PORT || 3000;
const DIST = path.join(__dirname, 'dist');
const STAGING = process.env.SITE_ENV === 'staging';
const CANONICAL_HOST = process.env.CANONICAL_HOST;

app.disable('x-powered-by');
app.set('trust proxy', true);
app.use(compression());

// Hostname + HTTPS normalization (only when CANONICAL_HOST is set, i.e. in production)
app.use((req, res, next) => {
  if (CANONICAL_HOST && (req.hostname !== CANONICAL_HOST || req.protocol !== 'https')) {
    return res.redirect(301, `https://${CANONICAL_HOST}${req.originalUrl}`);
  }
  next();
});

app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'SAMEORIGIN',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  });
  if (CANONICAL_HOST) res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  if (STAGING) res.set('X-Robots-Tag', 'noindex, nofollow');
  next();
});

// ---------- redirects (preserve legacy URLs) ----------
const cityHub = Object.fromEntries(site.cities.map((c) => [c.slug, `/locations/${c.county}/${c.slug}`]));
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  const p = req.path;
  const q = req.url.slice(p.length);
  // Trailing slash → none (the original site's convention)
  if (p.length > 1 && p.endsWith('/')) return res.redirect(301, p.replace(/\/+$/, '') + q);
  // The original site 301s /services/<slug> to /<slug>
  let m = p.match(/^\/services\/([a-z0-9-]+)$/);
  if (m && fs.existsSync(path.join(DIST, m[1] + '.html'))) return res.redirect(301, '/' + m[1] + q);
  // /locations/<city> (referenced in the old structured data) → city hub
  m = p.match(/^\/locations\/([a-z0-9-]+)$/);
  if (m && cityHub[m[1]]) return res.redirect(301, cityHub[m[1]] + q);
  // .html and /index variants → clean URL
  if (/\.html$/.test(p)) return res.redirect(301, (p.replace(/(\/index)?\.html$/, '') || '/') + q);
  next();
});

// ---------- estimate form ----------
app.use('/api', express.urlencoded({ extended: false, limit: '20kb' }), express.json({ limit: '20kb' }));
const recent = new Map(); // naive per-IP rate limit: 5 requests / 10 minutes
app.post('/api/estimate', async (req, res) => {
  const wantsJson = (req.get('accept') || '').includes('application/json');
  const reply = (status, body) => {
    if (wantsJson) return res.status(status).json(body);
    return res.redirect(303, body.ok ? '/estimate-results?sent=1' : '/get-a-free-quote?error=1#estimate-form');
  };
  const b = req.body || {};
  if (b.website) return reply(200, { ok: true, message: 'Thanks — your request was received.' }); // honeypot
  const clean = (v, n) => String(v || '').trim().slice(0, n);
  const data = { name: clean(b.name, 100), phone: clean(b.phone, 30), email: clean(b.email, 120), city: clean(b.city, 60), service: clean(b.service, 80), details: clean(b.details, 2000) };
  const problems = [];
  if (!data.name) problems.push('name is required');
  if (data.phone.replace(/\D/g, '').length < 10) problems.push('phone needs a 10-digit number');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) problems.push('email address is not valid');
  if (!data.city) problems.push('choose the property city');
  if (!data.service) problems.push('choose a service');
  if (problems.length) return reply(400, { ok: false, error: 'Please fix: ' + problems.join('; ') + '.' });

  const now = Date.now();
  const hits = (recent.get(req.ip) || []).filter((t) => now - t < 600000);
  if (hits.length >= 5) return reply(429, { ok: false, error: `Too many requests. Please call ${site.phone}.` });
  recent.set(req.ip, hits.concat(now));

  if (!process.env.FORM_WEBHOOK_URL) {
    console.warn('[estimate] FORM_WEBHOOK_URL is not set; request NOT delivered:', { ...data, details: data.details.slice(0, 80) });
    return reply(503, { ok: false, error: `Online requests are not connected yet. Please call ${site.phone} or email ${site.email}.` });
  }
  try {
    const r = await fetch(process.env.FORM_WEBHOOK_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, source: 'precisionpaintexperts.com', page: req.get('referer') || '', receivedAt: new Date().toISOString() })
    });
    if (!r.ok) throw new Error('webhook status ' + r.status);
    return reply(200, { ok: true, message: 'Thanks! Your estimate request was sent. A crew lead will contact you to schedule the walkthrough.' });
  } catch (e) {
    console.error('[estimate] delivery failed:', e.message);
    return reply(502, { ok: false, error: `We could not send your request. Please call ${site.phone}.` });
  }
});

// ---------- static files ----------
app.use('/agent', (req, res, next) => { res.set('X-Robots-Tag', 'noindex'); next(); });
app.use(express.static(DIST, {
  extensions: ['html'],
  index: 'index.html',
  redirect: false,
  setHeaders(res, file) {
    if (/\.[0-9a-f]{10}\.(css|js|json)$/.test(file)) res.set('Cache-Control', 'public, max-age=31536000, immutable');
    else if (/\/img\//.test(file) || /\.(png|svg|webp|jpg)$/.test(file)) res.set('Cache-Control', 'public, max-age=2592000');
    else if (file.endsWith('.html')) res.set('Cache-Control', 'public, max-age=0, must-revalidate');
  }
}));

// ---------- 404 ----------
app.use((req, res) => {
  res.status(404);
  const f = path.join(DIST, '404.html');
  if (fs.existsSync(f)) return res.sendFile(f);
  res.type('text').send('Not found — run `npm run build` first.');
});

if (require.main === module) {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) console.warn('dist/ is empty — run `npm run build` first.');
  app.listen(PORT, () => console.log(`Precision Paint Experts site on http://localhost:${PORT}${STAGING ? ' (staging: noindex)' : ''}`));
}
module.exports = app;
