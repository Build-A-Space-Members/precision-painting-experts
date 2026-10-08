// Shared markup: head, header, footer, hero, cards, forms, FAQ, CTA bands.
const site = require('../data/site');
const images = require('../data/images.json');

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = (p) => site.url + (p === '/' ? '/' : p);

// ---------- icons (inline SVG, decorative) ----------
const ICON = {
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
  chev: '<path d="m6 9 6 6 6-6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  dots: '<circle cx="12" cy="12" r="10"/><circle cx="8" cy="12" r=".8" fill="currentColor"/><circle cx="12" cy="12" r=".8" fill="currentColor"/><circle cx="16" cy="12" r=".8" fill="currentColor"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="M15.5 12.9 17 22l-5-3-5 3 1.5-9.1"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  badge: '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z"/><path d="M2 21c0-3 1.9-5.4 5.2-6"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.7V17c0 .6-.5 1-1 1.2C7.9 18.8 7 20.2 7 22M14 14.7V17c0 .6.5 1 1 1.2 1.1.6 2 2 2 3.8M18 2H6v7a6 6 0 0 0 12 0z"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  palette: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1a1.6 1.6 0 0 1 1.6-1.7h2c3.1 0 5.6-2.5 5.6-5.6C22 6 17.5 2 12 2z"/>',
  list: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  thumb: '<path d="M7 10v12M15 5.9 14 10h5.8a2 2 0 0 1 1.9 2.6l-2.3 8a2 2 0 0 1-2 1.4H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.8a2 2 0 0 0 1.8-1.1L12 2a3.1 3.1 0 0 1 3 3.9z"/>',
  brush: '<path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>'
};
const icon = (name, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICON[name] || ''}</svg>`;

// Precision Paint Experts mark: the orange "P" badge used on precisionpaintexperts.com.
const logoMark = (cls = 'brand-mark') => `<svg class="${cls}" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><rect width="64" height="64" rx="14" fill="#f08a33"/><text x="32" y="46" text-anchor="middle" font-family="Montserrat,Arial,sans-serif" font-size="40" font-weight="800" fill="#0f1f38">P</text></svg>`;

// ---------- images ----------
const IMG = {
  home: { key: 'florida-home-exterior-painting', alt: 'Two-story Florida home with fresh pale-yellow paint, white trim, and navy shutters' },
  roller: { key: 'stucco-wall-paint-roller', alt: 'Paint roller applying a cream finish coat to a textured stucco wall' },
  cabinet: { key: 'cabinet-refinishing-painter', alt: 'Painter spray-finishing white cabinet boxes in a protected work area' },
  commercial: { key: 'commercial-storefront-painting', alt: 'Freshly painted two-story commercial storefront under a clear Florida sky' }
};
function imageFor(slug = '') {
  if (/cabinet/.test(slug)) return 'cabinet';
  if (/commercial|office|retail|warehouse|church|multi-family|hoa|graffiti|industrial/.test(slug)) return 'commercial';
  if (/interior|drywall|ceiling|popcorn|wallpaper|color|faux|trim|door|stucco|concrete|masonry|waterproof|epoxy|garage/.test(slug)) return 'roller';
  return 'home';
}
// <picture> with WebP + JPEG srcsets. alt === '' marks a decorative image.
function picture(name, { sizes = '100vw', eager = false, alt, cls = '' } = {}) {
  const im = IMG[name] || IMG.home;
  const meta = images[im.key];
  const set = (ext) => meta.widths.map((w) => `/img/${im.key}-${w}.${ext} ${w}w`).join(', ');
  const fallback = `/img/${im.key}-${meta.widths[Math.min(2, meta.widths.length - 1)]}.jpg`;
  const altText = alt === undefined ? im.alt : alt;
  return `<picture><source type="image/webp" srcset="${set('webp')}" sizes="${sizes}"><img src="${fallback}" srcset="${set('jpg')}" sizes="${sizes}" width="${meta.width}" height="${meta.height}" alt="${esc(altText)}"${cls ? ` class="${cls}"` : ''} ${eager ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"'}></picture>`;
}
const ogImage = (name) => `${site.url}/img/${(IMG[name] || IMG.home).key}-1280.jpg`;

// ---------- head ----------
function head({ title, description, canonical, robots, ogType = 'website', image, jsonld = [], assets, preload }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="${robots}">
<meta name="theme-color" content="#0f1f38">
<meta property="og:site_name" content="${site.name}">
<meta property="og:locale" content="en_US">
<meta property="og:type" content="${ogType}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${image}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${image}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap">
${preload || ''}<link rel="stylesheet" href="${assets.css}">
${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`).join('\n')}
</head>`;
}

// ---------- header / nav ----------
function nav(ctx) {
  const svc = ctx.services;
  const serviceLinks = [...site.coreServices, 'commercial-interior-painting', 'commercial-exterior-painting'].filter((s) => svc[s])
    .map((s) => `<li><a href="/${s}">${esc(svc[s].navLabel)}</a></li>`).join('');
  const countyLinks = site.counties.map((c) => `<li><a class="dd-head" href="/locations/${c.slug}">${c.name}</a></li>` +
    site.cities.filter((x) => x.county === c.slug).map((x) => `<li><a href="/locations/${c.slug}/${x.slug}">${x.name}, FL</a></li>`).join('')).join('');
  return { serviceLinks, countyLinks };
}
function header(ctx, { solid = false } = {}) {
  const { serviceLinks, countyLinks } = nav(ctx);
  const chev = icon('chev', 'chev');
  return `<a class="skip" href="#main">Skip to content</a>
<header class="site-header${solid ? ' solid' : ''}" id="top">
  <div class="wrap hdr">
    <a class="brand" href="/" aria-label="${site.name} home">${logoMark()}<span class="brand-text"><span class="brand-name">Precision Paint</span><span class="brand-sub">Experts</span></span></a>
    <div class="hdr-right">
      <div class="hdr-cta">
        <a class="btn btn-blue" href="${site.phoneHref}" aria-label="Call ${site.phone}">${icon('phone')}<span>${site.phone}</span></a>
        <a class="btn btn-accent" href="/get-a-free-quote">${icon('clipboard')}Free Estimate</a>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="Open menu">${icon('menu')}</button>
      </div>
      <nav class="nav" aria-label="Main">
        <ul>
          <li><a href="/about-us" aria-haspopup="true">About ${chev}</a>
            <ul class="dropdown"><li><a href="/about-us">About Us</a></li><li><a href="/our-faq">Painting FAQ</a></li><li><a href="/our-gallery">Project Gallery</a></li><li><a href="/estimate-results">How Estimates Work</a></li><li><a href="/contact-us">Contact</a></li></ul></li>
          <li><a href="/service-areas" aria-haspopup="true">Locations ${chev}</a>
            <ul class="dropdown wide"><li><a class="dd-head" href="/service-areas">All Service Areas</a></li>${countyLinks}</ul></li>
          <li><a href="/services" aria-haspopup="true">Services ${chev}</a>
            <ul class="dropdown wide"><li><a class="dd-head" href="/services">All Painting Services</a></li>${serviceLinks}<li><a class="dd-head" href="/specialty-services">Specialty Coatings</a></li></ul></li>
          <li><a href="/our-blog">Articles</a></li>
          <li><a href="/our-gallery">Our Work</a></li>
          <li><a href="/our-faq">FAQ</a></li>
          <li><a href="/contact-us">Contact Us</a></li>
        </ul>
      </nav>
    </div>
  </div>
  <nav class="mobile-nav" id="mobile-nav" aria-label="Mobile">
    <ul>
      <li><a href="/">Home</a></li>
      <li><details><summary>About</summary><ul><li><a href="/about-us">About Us</a></li><li><a href="/our-faq">Painting FAQ</a></li><li><a href="/our-gallery">Project Gallery</a></li><li><a href="/contact-us">Contact</a></li></ul></details></li>
      <li><details><summary>Services</summary><ul><li><a href="/services">All Painting Services</a></li>${serviceLinks}<li><a href="/specialty-services">Specialty Coatings</a></li></ul></details></li>
      <li><details><summary>Locations</summary><ul><li><a href="/service-areas">All Service Areas</a></li>${countyLinks}</ul></details></li>
      <li><a href="/our-blog">Articles</a></li>
      <li class="m-cta"><a class="btn btn-accent" href="/get-a-free-quote">${icon('clipboard')}Free Estimate</a></li>
    </ul>
  </nav>
</header>`;
}

// ---------- footer ----------
function footer(ctx) {
  const svc = ctx.services;
  const svcLinks = site.coreServices.filter((s) => svc[s]).map((s) => `<li><a href="/${s}">${esc(svc[s].navLabel)}</a></li>`).join('');
  const commLinks = site.commercialServices.slice(0, 5).filter((s) => svc[s]).map((s) => `<li><a href="/${s}">${esc(svc[s].navLabel)}</a></li>`).join('');
  const cityLinks = site.cities.map((c) => `<li><a href="/${c.slug}-fl-painting-services">${c.name}</a></li>`).join('');
  const countyLinks = site.counties.map((c) => `<li><a href="/locations/${c.slug}">${c.name}</a></li>`).join('');
  const year = new Date().getFullYear();
  return `<footer class="site-footer">
  <div class="wrap ft">
    <div class="ft-brand">
      <a class="ft-logo" href="/" aria-label="${site.name} home">${logoMark('')}<span class="brand-text"><span class="brand-name">Precision Paint</span><span class="brand-sub">Experts</span></span></a>
      <p>Locally owned painting contractor in Newberry, FL — residential, commercial, cabinets, exteriors, decks, and pressure washing across North Central Florida.</p>
      <div class="btns"><a class="btn btn-accent" href="/get-a-free-quote">${icon('clipboard')}Free Estimate</a><a class="btn btn-blue" href="${site.phoneHref}">${icon('phone')}${site.phone}</a></div>
      <p class="ft-nap">${site.legalName}<br>${site.city}, ${site.region} ${site.zip}<br><a href="mailto:${site.email}">${site.email}</a><br>Mon–Fri 9:00 AM – 6:30 PM</p>
    </div>
    <div class="ft-cols">
      <div class="ft-col"><h2>About</h2><ul><li><a href="/about-us">About Us</a></li><li><a href="/our-faq">FAQ</a></li><li><a href="/our-gallery">Our Work</a></li><li><a href="/our-blog">Articles</a></li><li><a href="/get-a-free-quote">Free Estimate</a></li><li><a href="/contact-us">Contact Us</a></li></ul></div>
      <div class="ft-col"><h2>Locations</h2><ul><li><a href="/service-areas">Service Areas</a></li>${countyLinks}</ul></div>
      <div class="ft-col"><h2>Services</h2><ul>${svcLinks}<li><a href="/specialty-services">Specialty Coatings</a></li></ul></div>
      <div class="ft-col"><h2>Commercial</h2><ul><li><a href="/commercial-painting">Commercial Painting</a></li>${commLinks}</ul></div>
      <div class="ft-col"><h2>Cities We Serve</h2><ul>${cityLinks}</ul></div>
    </div>
  </div>
  <div class="wrap ft-bottom"><span>© ${year} ${site.legalName}. All rights reserved.</span><span><a href="/terms-and-conditions">Terms &amp; Conditions</a> · <a href="/privacy-policy">Privacy Policy</a> · <a href="/sitemap.xml">Sitemap</a></span></div>
</footer>`;
}

// ---------- page pieces ----------
function crumbs(list) {
  if (!list || list.length < 2) return '';
  return `<nav class="crumbs" aria-label="Breadcrumb"><div class="wrap"><ol>${list.map((c, i) => i === list.length - 1
    ? `<li><span aria-current="page">${esc(c.name)}</span></li>`
    : `<li><a href="${c.path}">${esc(c.name)}</a></li>`).join('')}</ol></div></nav>`;
}
function pageHero({ h1, sub, intro, img = 'home', meta = '', short = false }) {
  return `<section class="hero hero-page${short ? ' hero-short' : ''}">
  <div class="hero-bg">${picture(img, { eager: true, alt: '' })}</div>
  <div class="wrap hero-inner">
    ${meta}
    <h1>${esc(h1)}${sub ? `<span class="hero-sub">${esc(sub)}</span>` : ''}</h1>
    ${intro ? `<p class="hero-lead">${esc(intro)}</p>` : ''}
    <div class="hero-actions"><a class="btn btn-accent" href="/get-a-free-quote">${icon('clipboard')}Free Estimate</a><a class="link-arrow" href="#main">Learn more →</a></div>
  </div>
</section>`;
}
function serviceCard(slug, svc, label) {
  const s = svc[slug];
  if (!s) return '';
  return `<article class="card">
  <div class="card-top">${picture(imageFor(slug), { sizes: '(max-width: 620px) 100vw, 340px', alt: '' })}<h3>${esc(s.navLabel)}</h3></div>
  <div class="card-body"><p>${esc(s.card)}</p></div>
  <a class="card-btn" href="/${slug}">${icon('dots')}<span>${esc(label || `Learn more about ${s.navLabel}`)}</span></a>
</article>`;
}
function faqBlock(faqs, heading = 'Frequently asked questions') {
  if (!faqs || !faqs.length) return '';
  return `<section class="section section-gray" aria-labelledby="faq-h"><div class="wrap">
  <div class="section-head"><h2 id="faq-h">${esc(heading)}</h2></div>
  <div class="faq">${faqs.map((f) => `<details><summary>${esc(f.q)}</summary><div class="ans"><p>${f.a}</p></div></details>`).join('')}</div>
</div></section>`;
}
function warrantyBand(text, h2 = 'Quality Workmanship Backed by a <span class="hl">Written</span> Warranty') {
  return `<section class="section"><div class="wrap warranty">
  <svg class="shield" viewBox="0 0 240 260" role="img" aria-label="Written workmanship warranty badge">
    <path d="M120 8 222 44v74c0 66-44 114-102 134C62 232 18 184 18 118V44Z" fill="#003082"/>
    <path d="M120 26 206 56v62c0 56-37 97-86 115-49-18-86-59-86-115V56Z" fill="none" stroke="#f08a33" stroke-width="6"/>
    <text x="120" y="100" text-anchor="middle" font-family="Montserrat,Arial,sans-serif" font-weight="800" font-size="20" fill="#fff">WRITTEN</text>
    <rect x="22" y="112" width="196" height="46" rx="6" fill="#f08a33"/>
    <text x="120" y="144" text-anchor="middle" font-family="Montserrat,Arial,sans-serif" font-weight="800" font-size="26" fill="#0f1f38">WARRANTY</text>
    <text x="120" y="186" text-anchor="middle" font-family="Montserrat,Arial,sans-serif" font-weight="700" font-size="15" fill="#fff">UP TO 10 YEARS</text>
    <text x="120" y="204" text-anchor="middle" font-family="Montserrat,Arial,sans-serif" font-weight="600" font-size="10" fill="#c9dafa">ON EXTERIORS</text>
  </svg>
  <div>
    <h2>${h2}</h2>
    <p>${text || 'Every Precision Paint Experts project closes with a punch walk you sign, labelled touch-up paint left on site, and a written workmanship warranty — up to 10 years on exterior projects — on top of the manufacturer’s product warranty. If something is not right at the final walkthrough, we fix it before the job is closed out.'}</p>
    <div class="btns"><a class="btn btn-blue" href="/about-us">${icon('shield')}How We Work</a><a class="btn btn-accent" href="/get-a-free-quote">${icon('clipboard')}Free Estimate</a></div>
  </div>
</div></section>`;
}
function ctaGray(h2 = 'Ready for a straight-shooter painting estimate?', text = 'Tell us about the rooms, elevations, or building you want painted. A crew lead walks the property, measures, and sends a written, itemized estimate — free, with no obligation.') {
  return `<section class="cta-gray"><div class="wrap"><h2>${h2}</h2><p>${text}</p><div class="hero-actions" style="justify-content:center"><a class="btn btn-accent" href="/get-a-free-quote">${icon('clipboard')}Free Estimate</a><a class="btn btn-blue" href="${site.phoneHref}">${icon('phone')}${site.phone}</a></div></div></section>`;
}

// ---------- estimate form (first-party; also a WebMCP declarative tool) ----------
function estimateForm(ctx, { heading = 'Request your free estimate', id = 'estimate-form' } = {}) {
  const cityOpts = site.cities.map((c) => `<option>${c.name}</option>`).join('') + '<option>Other / not sure</option>';
  const svcOpts = ['Interior painting', 'Exterior painting', 'Cabinet painting & refinishing', 'Commercial painting', 'Deck & fence staining', 'Pressure washing', 'Drywall / ceiling / wallpaper', 'Specialty coatings (epoxy, stucco, waterproofing)', 'Color consultation', 'Other']
    .map((s) => `<option>${s}</option>`).join('');
  return `<div class="form-card" id="contact-form">
  <h2>${esc(heading)}</h2>
  <form id="${id}" class="js-estimate" action="/api/estimate" method="post" novalidate
    toolname="request_estimate"
    tooldescription="Sends a free painting estimate request to Precision Paint Experts (North Central Florida). A crew lead follows up to schedule a walkthrough. The visitor reviews the details and presses Send themselves.">
    <div class="form-grid">
      <div class="field"><label for="f-name">Full name</label><input id="f-name" name="name" autocomplete="name" required maxlength="100" toolparamdescription="Visitor's full name"></div>
      <div class="field"><label for="f-phone">Phone</label><input id="f-phone" name="phone" type="tel" autocomplete="tel" required maxlength="30" toolparamdescription="Best phone number, US format"></div>
      <div class="field full"><label for="f-email">Email</label><input id="f-email" name="email" type="email" autocomplete="email" required maxlength="120" toolparamdescription="Email address for the written estimate"></div>
      <div class="field"><label for="f-city">Property city</label><select id="f-city" name="city" required toolparamdescription="City where the property is located"><option value="">Choose a city</option>${cityOpts}</select></div>
      <div class="field"><label for="f-service">Service needed</label><select id="f-service" name="service" required toolparamdescription="Main type of painting work needed"><option value="">Choose a service</option>${svcOpts}</select></div>
      <div class="field full"><label for="f-details">Project details</label><textarea id="f-details" name="details" maxlength="2000" toolparamdescription="Rooms or areas, property type, current condition, and ideal timeline"></textarea></div>
      <div class="hp" aria-hidden="true"><label for="f-website">Leave this empty</label><input id="f-website" name="website" tabindex="-1" autocomplete="off" toolparamdescription="Spam trap. Always leave empty."></div>
    </div>
    <button class="btn btn-accent" type="submit" style="margin-top:14px">${icon('clipboard')}Send my estimate request</button>
    <p class="form-status" id="form-status" role="status" aria-live="polite"></p>
    <p class="form-note">Prefer the phone? Call <a href="${site.phoneHref}">${site.phone}</a>, Mon–Fri 9:00 AM – 6:30 PM. We use your details only to respond to this request (<a href="/privacy-policy">privacy policy</a>).</p>
  </form>
</div>`;
}

module.exports = { esc, abs, icon, logoMark, picture, imageFor, ogImage, IMG, head, header, footer, crumbs, pageHero, serviceCard, faqBlock, warrantyBand, ctaGray, estimateForm };
