// Page renderers for every content type. Layout follows spraytexpainting.com; copy comes
// from content/pages/*.json.
const site = require('../data/site');
const C = require('./components');
const { esc, abs, icon, picture, imageFor } = C;

const cityBySlug = Object.fromEntries(site.cities.map((c) => [c.slug, c]));
const countyBySlug = Object.fromEntries(site.counties.map((c) => [c.slug, c]));

// ---------- structured data ----------
const BIZ_ID = `${site.url}/#business`;
function business() {
  return {
    '@type': 'PaintingContractor', '@id': BIZ_ID, name: site.name, legalName: site.legalName, url: site.url + '/',
    telephone: site.phone, email: site.email, image: C.ogImage('home'), logo: `${site.url}/icon-512.png`,
    address: { '@type': 'PostalAddress', addressLocality: site.city, addressRegion: site.region, postalCode: site.zip, addressCountry: 'US' },
    areaServed: site.counties.map((c) => ({ '@type': 'AdministrativeArea', name: `${c.name}, FL` })),
    openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: site.hours[0].schema, opens: site.hours[0].opens, closes: site.hours[0].closes }]
  };
}
function breadcrumbLd(list) {
  return { '@type': 'BreadcrumbList', itemListElement: list.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.path) })) };
}
function faqLd(faqs) {
  const strip = (s) => String(s).replace(/<[^>]+>/g, '');
  return { '@type': 'FAQPage', mainEntity: faqs.map((f) => ({ '@type': 'Question', name: strip(f.q), acceptedAnswer: { '@type': 'Answer', text: strip(f.a) } })) };
}
function graph(page, crumbsList, extra = []) {
  const g = [business(), { '@type': 'WebSite', '@id': `${site.url}/#website`, url: site.url + '/', name: site.name, publisher: { '@id': BIZ_ID } },
    { '@type': 'WebPage', '@id': abs(page.path) + '#webpage', url: abs(page.path), name: page.title, description: page.description, isPartOf: { '@id': `${site.url}/#website` } }];
  if (crumbsList && crumbsList.length > 1) g.push(breadcrumbLd(crumbsList));
  if (page.faqs && page.faqs.length) g.push(faqLd(page.faqs));
  return [{ '@context': 'https://schema.org', '@graph': g.concat(extra) }];
}

// ---------- shared content rendering ----------
function bulletsHtml(b) { return b && b.length ? `<ul>${b.map((x) => `<li>${x}</li>`).join('')}</ul>` : ''; }
function sectionHtml(s) { return `<h2>${esc(s.h2)}</h2>${(s.body || []).map((p) => `<p>${p}</p>`).join('')}${bulletsHtml(s.bullets)}`; }

// First two sections alternate text/photo like Spray Tex inner pages; the rest flow in one column.
function contentSections(page, imgs, { sidebar } = {}) {
  const secs = page.sections || [];
  const caps = { home: 'Exterior repaint on a two-story Florida home', roller: 'Finish coat going on over textured stucco', cabinet: 'Cabinet boxes being spray-finished', commercial: 'Commercial exterior repaint' };
  const lead = secs.slice(0, 2).map((s, i) => {
    const im = imgs[i % imgs.length];
    return `<div class="content-block"><div class="wrap split${i % 2 ? ' flip' : ''}">
  <div class="prose">${sectionHtml(s)}</div>
  <div class="split-media"><figure>${picture(im, { sizes: '(max-width: 900px) 100vw, 480px' })}<figcaption>${caps[im]}</figcaption></figure></div>
</div></div>`;
  }).join('');
  const rest = secs.slice(2);
  const body = rest.length ? `<div class="content-block"><div class="wrap ${sidebar ? 'layout-side' : 'narrow'}"><div class="prose">${rest.map(sectionHtml).join('')}</div>${sidebar || ''}</div></div>` : '';
  return lead + body;
}

function relatedTiles(page, ctx, heading = 'Related pages') {
  const items = (page.related || []).map((p) => ctx.pages[p]).filter(Boolean);
  if (!items.length) return '';
  return `<section class="section"><div class="wrap"><div class="section-head"><h2>${esc(heading)}</h2></div><div class="link-grid">${items.map((r) =>
    `<a class="link-tile" href="${r.path}"><b>${esc(r.navLabel || r.h1)}</b><span>${esc(r.card || r.excerpt || r.heroIntro || r.description)}</span></a>`).join('')}</div></div></section>`;
}

function sideCards(ctx, { services = [], extra = '' } = {}) {
  const svc = ctx.services;
  const list = services.filter((s) => svc[s]).map((s) => `<li><a href="/${s}">${esc(svc[s].navLabel)}</a></li>`).join('');
  return `<aside class="sidebar" aria-label="Get an estimate">
  <div class="side-card side-cta"><h2>Free written estimate</h2><p>A crew lead measures, photographs, and sends an itemized quote — usually within one business day of the walkthrough.</p><a class="btn btn-accent" href="/get-a-free-quote">${icon('clipboard')}Request estimate</a><p style="margin:12px 0 0">or call <a style="color:#fff" href="${site.phoneHref}">${site.phone}</a></p></div>
  ${list ? `<div class="side-card"><h2>Related services</h2><ul>${list}</ul></div>` : ''}
  ${extra}
</aside>`;
}

function shell(ctx, page, { robots, crumbsList, hero, main, jsonld, ogType, img = 'home', solidHeader = false }) {
  const isIndexable = robots.startsWith('index');
  return `${C.head({
    title: page.title, description: page.description, canonical: abs(page.path), robots, ogType, image: C.ogImage(img),
    jsonld: isIndexable ? jsonld : [], assets: ctx.assets
  })}
<body>
${C.header(ctx, { solid: solidHeader })}
${hero || ''}
${C.crumbs(crumbsList)}
<main id="main">
${main}
</main>
${C.footer(ctx)}
<script src="${ctx.assets.js}" defer></script>
<script src="${ctx.assets.agentJs}" data-catalog="${ctx.assets.catalog}" defer></script>
</body>
</html>`;
}

// ---------- page types ----------
function renderHome(page, ctx) {
  const s = page.sections;
  const svc = ctx.services;
  const split = (b) => { const [t, ...r] = b.split('|'); return { t, d: r.join('|') }; };
  const whyIcons = ['shield', 'file', 'calendar', 'trophy'];
  const trioIcons = ['palette', 'list', 'thumb'];
  const why = (s[1].bullets || []).map(split);
  const trio = (s[2].bullets || []).map(split);
  const cards = site.coreServices.map((slug) => C.serviceCard(slug, svc)).join('');
  const countyCards = site.counties.map((c, i) => {
    const towns = site.cities.filter((x) => x.county === c.slug);
    return `<article class="loc-card"><div class="card-top">${picture(['home', 'commercial', 'roller', 'home', 'cabinet'][i], { sizes: '340px', alt: '' })}<h3>${c.name}</h3></div>
<div class="card-body"><p>${esc(c.blurb)}</p><ul>${towns.map((t) => `<li><a href="/locations/${c.slug}/${t.slug}">Painters in ${t.name}</a></li>`).join('')}</ul></div>
<a class="btn btn-blue read" href="/locations/${c.slug}">Read More</a></article>`;
  }).join('');
  const hero = `<section class="hero hero-home">
  <div class="hero-bg">${picture('home', { eager: true, alt: '' })}</div>
  <div class="wrap hero-inner">
    <span class="hero-kicker">Residential &amp; Commercial Painters</span>
    <h1>${esc(page.h1)}</h1>
    <p class="hero-lead">${esc(page.heroIntro)}</p>
    <div class="hero-actions"><a class="btn btn-accent" href="/get-a-free-quote">${icon('clipboard')}Free Estimate</a><a class="link-arrow" href="/about-us">Learn more →</a></div>
    <div class="trust-cards">
      <div class="trust-card">${icon('award')}<div><b>15+ Years</b><span>Painting North Central Florida</span></div></div>
      <div class="trust-card">${icon('shield')}<div><b>Licensed &amp; Insured</b><span>Bonded, workers’ comp on every crew</span></div></div>
      <div class="trust-card">${icon('badge')}<div><b>Written Warranty</b><span>Up to 10 years on exteriors</span></div></div>
    </div>
    <div class="badge-bar">
      <div>${icon('file')}Free itemized estimates</div>
      <div>${icon('users')}Our own crews — no subs</div>
      <div>${icon('brush')}Sherwin-Williams &amp; Benjamin Moore</div>
      <div>${icon('leaf')}Low-VOC options</div>
    </div>
  </div>
</section>`;
  const main = `<section class="section"><div class="wrap">
  <div class="section-head"><h2>${esc(s[0].h2).replace(/(painting[^<]*)$/i, '<span class="hl">$1</span>')}</h2>${s[0].body.map((p) => `<p>${p}</p>`).join('')}</div>
  <div class="cards">${cards}</div>
  <p class="more-link"><a class="btn btn-blue" href="/services">See all painting services</a> <a class="link-under" style="margin-left:14px" href="/specialty-services">Specialty coatings →</a></p>
</div></section>
<section class="band band-brown"><div class="band-bg">${picture('cabinet', { alt: '' })}</div><div class="wrap section">
  <h2 class="band-title">${esc(s[1].h2).replace(/(exceeds? expectations)/i, '<b>$1</b>')}</h2>
  <div class="why" style="margin-top:30px">
    <div class="why-cta"><p>Get your painting project started today:</p><div class="btns"><a class="btn btn-blue" href="${site.phoneHref}">${icon('phone')}${site.phone}</a><a class="btn btn-accent" href="/get-a-free-quote">${icon('clipboard')}Free Estimate</a></div></div>
    <div class="why-grid">${why.map((w, i) => `<div class="why-item"><h3>${icon(whyIcons[i % 4])}${esc(w.t)}</h3><p>${w.d}</p></div>`).join('')}</div>
  </div>
</div></section>
<section class="band band-blue"><div class="band-bg">${picture('home', { alt: '' })}</div><div class="wrap section center">
  <h2>How Much Will It Cost to Paint My House?</h2>
  <p class="narrow" style="margin:0 auto 18px">No two houses price the same. A written estimate from Precision Paint Experts is built from measured wall and trim area, the repair and prep your surfaces actually need, the product line, access and height, and the number of colors — each shown as its own line so you can compare bids honestly.</p>
  <div class="hero-actions"><a class="btn btn-accent" href="/get-a-free-quote">${icon('clipboard')}Get Your Estimate</a><a class="link-under" style="color:#fff" href="/our-faq">Read the painting FAQ</a></div>
</div></section>
<section class="band band-dark"><div class="band-bg">${picture('roller', { alt: '' })}</div><div class="wrap section center">
  <h2>${esc(s[2].h2)}</h2>
  ${s[2].body.map((p) => `<p class="narrow" style="margin:0 auto 18px">${p}</p>`).join('')}
  <div class="hero-actions"><a class="btn btn-accent" href="/get-a-free-quote">${icon('clipboard')}Free Estimate</a><a class="link-under" style="color:#fff" href="/color-consultation">Learn More</a></div>
  <div class="icon-trio">${trio.map((t, i) => `<div><span class="ic">${icon(trioIcons[i % 3])}</span><h3>${esc(t.t)}</h3><p>${t.d}</p></div>`).join('')}</div>
</div></section>
<section class="section"><div class="wrap">
  <div class="section-head"><h2><span class="hl">We Are Your</span> Local Painting Company in North Central Florida</h2><p>${s[4].body.join(' ')}</p></div>
  <div class="loc-cards three">${countyCards}</div>
  <div class="city-chips">${site.cities.map((c) => `<a href="/${c.slug}-fl-painting-services">${c.name}, FL</a>`).join('')}</div>
</div></section>
${C.warrantyBand(s[3].body.join(' '), esc(s[3].h2).replace(/(warranty)/i, '<span class="hl">$1</span>'))}
${s.slice(5).length ? `<section class="section section-gray"><div class="wrap narrow prose">${s.slice(5).map(sectionHtml).join('')}</div></section>` : ''}
${C.faqBlock(page.faqs)}
${C.ctaGray('Join our list of happy North Central Florida homeowners', 'Whether you are refreshing a single room or repainting a whole property, our crews bring the same careful prep and written warranty to every job.')}`;
  return shell(ctx, page, { robots: ctx.robots, hero, main, jsonld: graph(page, null), img: 'home' });
}

function renderService(page, ctx) {
  const slug = page.path.slice(1);
  const imgKey = imageFor(slug);
  const crumbsList = [{ name: 'Home', path: '/' }, { name: site.specialtyServices.includes(slug) ? 'Specialty Services' : 'Services', path: site.specialtyServices.includes(slug) ? '/specialty-services' : '/services' }, { name: page.navLabel || page.h1, path: page.path }];
  const imgs = [imgKey, imgKey === 'home' ? 'roller' : 'home'];
  const cityLinks = site.cityServices.find((x) => x.service === slug);
  const cityList = cityLinks ? `<section class="section section-gray"><div class="wrap"><div class="section-head"><h2>${esc(page.navLabel)} by city</h2><p>Local pages for each town on our North Central Florida route.</p></div><div class="city-chips">${site.cities.map((c) => {
    const p = `/${c.slug}-fl-${cityLinks.suffix}`; return ctx.pages[p] ? `<a href="${p}">${esc(ctx.pages[p].navLabel || `${cityLinks.name} in ${c.name}`)}</a>` : '';
  }).join('')}</div></div></section>` : '';
  const others = (site.coreServices.includes(slug) ? site.coreServices : site.specialtyServices.includes(slug) ? site.specialtyServices : site.commercialServices).filter((s) => s !== slug).slice(0, 6);
  const main = `${contentSections(page, imgs, { sidebar: sideCards(ctx, { services: others }) })}
${cityList}
${C.faqBlock(page.faqs, `${page.navLabel || 'Service'} questions`)}
${relatedTiles(page, ctx)}
${C.warrantyBand()}
${C.ctaGray()}`;
  const extra = [{ '@type': 'Service', name: page.navLabel || page.h1, serviceType: page.navLabel || page.h1, description: page.description, url: abs(page.path), provider: { '@id': BIZ_ID }, areaServed: site.counties.map((c) => ({ '@type': 'AdministrativeArea', name: `${c.name}, FL` })) }];
  return shell(ctx, page, { robots: ctx.robots, crumbsList, hero: C.pageHero({ h1: page.h1, intro: page.heroIntro, img: imgKey }), main, jsonld: graph(page, crumbsList, extra), img: imgKey });
}

function cityContext(page) {
  const m = page.path.match(/^\/locations\/([^/]+)\/([^/]+)$/);
  if (m) return { city: cityBySlug[m[2]], county: countyBySlug[m[1]] };
  const s = page.path.slice(1);
  const city = site.cities.slice().sort((a, b) => b.slug.length - a.slug.length).find((c) => s.startsWith(c.slug + '-fl-') || s.includes('-' + c.slug + '-fl-'));
  return { city, county: city && countyBySlug[city.county] };
}
function napCard(city) {
  return `<div class="side-card"><h2>Contact information</h2><table class="info-table"><tbody>
<tr><th scope="row">Company</th><td>${site.legalName}</td></tr>
<tr><th scope="row">Based in</th><td>${site.city}, ${site.region} ${site.zip}</td></tr>
<tr><th scope="row">Serving</th><td>${esc(city.name)}, FL ${city.zip}</td></tr>
<tr><th scope="row">Phone</th><td><a href="${site.phoneHref}">${site.phone}</a></td></tr>
<tr><th scope="row">Email</th><td><a href="mailto:${site.email}">${site.email}</a></td></tr>
<tr><th scope="row">Hours</th><td>Mon–Fri 9:00 AM – 6:30 PM</td></tr></tbody></table></div>`;
}
function renderCity(page, ctx) {
  const { city, county } = cityContext(page);
  const crumbsList = [{ name: 'Home', path: '/' }, { name: 'Service Areas', path: '/service-areas' }, { name: county.name, path: `/locations/${county.slug}` }, { name: city.name, path: page.path }];
  const svcTiles = site.cityServices.map((cs) => ctx.pages[`/${city.slug}-fl-${cs.suffix}`]).filter(Boolean);
  const neighbors = site.cities.filter((c) => c.county === county.slug && c.slug !== city.slug);
  const main = `${contentSections(page, ['home', 'roller'], { sidebar: `<aside class="sidebar">${napCard(city)}${sideCards(ctx).replace(/^<aside[^>]*>|<\/aside>$/g, '')}</aside>` })}
<section class="section section-gray"><div class="wrap"><div class="section-head"><h2>Painting services in ${esc(city.name)}, FL</h2></div><div class="link-grid">${svcTiles.map((t) =>
    `<a class="link-tile" href="${t.path}"><b>${esc(t.h1)}</b><span>${esc(t.heroIntro || t.description)}</span></a>`).join('')}</div>
${neighbors.length ? `<div class="city-chips">${neighbors.map((n) => `<a href="/locations/${county.slug}/${n.slug}">Painters in ${n.name}</a>`).join('')}<a href="/locations/${county.slug}">All of ${county.name}</a></div>` : `<div class="city-chips"><a href="/locations/${county.slug}">All of ${county.name}</a><a href="/service-areas">Every service area</a></div>`}
</div></section>
${C.faqBlock(page.faqs, `Questions from ${city.name} property owners`)}
${relatedTiles(page, ctx)}
${C.ctaGray(`Get a free painting estimate in ${esc(city.name)}`)}`;
  const extra = [{ '@type': 'Service', name: `Painting contractor in ${city.name}, FL`, serviceType: 'Painting contractor', url: abs(page.path), provider: { '@id': BIZ_ID }, areaServed: { '@type': 'City', name: `${city.name}, FL`, geo: { '@type': 'GeoCoordinates', latitude: city.lat, longitude: city.lng } } }];
  return shell(ctx, page, { robots: ctx.robots, crumbsList, hero: C.pageHero({ h1: page.h1, intro: page.heroIntro, img: 'home' }), main, jsonld: graph(page, crumbsList, extra) });
}
function renderCityService(page, ctx) {
  const { city, county } = cityContext(page);
  const cs = site.cityServices.find((x) => page.path.endsWith('-fl-' + x.suffix));
  const svcSlug = cs ? cs.service : (/cabinet/.test(page.path) ? 'cabinet-painting-refinishing' : 'interior-painting');
  const imgKey = imageFor(svcSlug === 'services' ? 'home' : svcSlug);
  const hub = `/locations/${county.slug}/${city.slug}`;
  const crumbsList = [{ name: 'Home', path: '/' }, { name: 'Service Areas', path: '/service-areas' }, { name: `${city.name}, FL`, path: hub }, { name: page.h1, path: page.path }];
  const siblings = site.cityServices.map((x) => `/${city.slug}-fl-${x.suffix}`).filter((p) => p !== page.path && ctx.pages[p]);
  const sideExtra = `${napCard(city)}<div class="side-card"><h2>More in ${esc(city.name)}</h2><ul><li><a href="${hub}">Painting contractor in ${esc(city.name)}</a></li>${siblings.map((p) => `<li><a href="${p}">${esc(ctx.pages[p].h1)}</a></li>`).join('')}</ul></div>`;
  const main = `${contentSections(page, [imgKey, imgKey === 'home' ? 'roller' : 'home'], { sidebar: sideCards(ctx, { extra: sideExtra }) })}
${C.faqBlock(page.faqs)}
${relatedTiles(page, ctx)}
${C.ctaGray(`Free estimates in ${esc(city.name)} and across ${esc(county.name)}`)}`;
  const extra = [{ '@type': 'Service', name: page.h1, serviceType: cs ? cs.name : page.h1, url: abs(page.path), provider: { '@id': BIZ_ID }, areaServed: { '@type': 'City', name: `${city.name}, FL` } }];
  return shell(ctx, page, { robots: ctx.robots, crumbsList, hero: C.pageHero({ h1: page.h1, intro: page.heroIntro, img: imgKey }), main, jsonld: graph(page, crumbsList, extra), img: imgKey });
}
function renderCounty(page, ctx) {
  const slug = page.path.split('/').pop();
  const county = countyBySlug[slug];
  const crumbsList = [{ name: 'Home', path: '/' }, { name: 'Service Areas', path: '/service-areas' }, { name: county.name, path: page.path }];
  const towns = site.cities.filter((c) => c.county === slug);
  const main = `${contentSections(page, ['home', 'commercial'], { sidebar: sideCards(ctx, { services: site.coreServices.slice(0, 6) }) })}
<section class="section section-gray"><div class="wrap"><div class="section-head"><h2>Towns we serve in ${esc(county.name)}</h2></div><div class="link-grid">${towns.map((t) => {
    const p = ctx.pages[`/locations/${slug}/${t.slug}`]; return `<a class="link-tile" href="/locations/${slug}/${t.slug}"><b>Painters in ${t.name}, FL</b><span>${esc(p ? p.heroIntro : '')}</span></a>`;
  }).join('')}</div></div></section>
${C.faqBlock(page.faqs)}
${relatedTiles(page, ctx)}
${C.ctaGray()}`;
  return shell(ctx, page, { robots: ctx.robots, crumbsList, hero: C.pageHero({ h1: page.h1, intro: page.heroIntro, img: 'home' }), main, jsonld: graph(page, crumbsList) });
}

function postCard(p) {
  return `<article class="post-card">${picture(p.img, { sizes: '(max-width: 620px) 100vw, 360px', alt: '' })}<div class="pc-body"><span class="pc-meta">${esc(p.category)} · <time datetime="${p.date}">${esc(p.dateLabel)}</time></span><h3><a href="${p.path}">${esc(p.h1)}</a></h3><p>${esc(p.excerpt || p.description)}</p></div></article>`;
}
function renderPost(page, ctx) {
  const m = ctx.postMeta[page.path];
  const crumbsList = [{ name: 'Home', path: '/' }, { name: 'Articles', path: '/our-blog' }, { name: page.h1, path: page.path }];
  const meta = `<p class="meta-line"><span>${icon('calendar', 'chev')} <time datetime="${m.date}">${esc(m.dateLabel)}</time></span><a href="${m.categoryPath}">${esc(m.category)}</a><span>By ${site.name}</span></p>`;
  const tags = m.tags.length ? `<div class="tags" aria-label="Tags">${m.tags.map((t) => `<a href="${t.path}">#${esc(t.name)}</a>`).join('')}</div>` : '';
  const more = ctx.posts.filter((p) => p.path !== page.path && (p.category === m.category)).concat(ctx.posts.filter((p) => p.path !== page.path)).filter((p, i, a) => a.indexOf(p) === i).slice(0, 3);
  const main = `<div class="content-block"><div class="wrap layout-side"><article class="prose">${(page.sections || []).map(sectionHtml).join('')}${tags}</article>${sideCards(ctx, { services: (page.related || []).map((p) => p.slice(1)).filter((s) => ctx.services[s]) })}</div></div>
${C.faqBlock(page.faqs)}
<section class="section"><div class="wrap"><div class="section-head"><h2>Keep reading</h2></div><div class="post-grid">${more.map(postCard).join('')}</div></div></section>
${C.ctaGray()}`;
  const extra = [{ '@type': 'BlogPosting', headline: page.h1, description: page.description, datePublished: m.date, dateModified: m.date, image: C.ogImage(m.img), author: { '@type': 'Organization', name: site.name, url: site.url + '/' }, publisher: { '@id': BIZ_ID }, mainEntityOfPage: abs(page.path), articleSection: m.category, keywords: m.tags.map((t) => t.name).join(', ') }];
  return shell(ctx, page, { robots: ctx.robots, crumbsList, hero: C.pageHero({ h1: page.h1, intro: page.heroIntro || page.excerpt, img: m.img, meta, short: true }), main, jsonld: graph(page, crumbsList, extra), ogType: 'article', img: m.img });
}

function renderCompare(page, ctx) {
  const crumbsList = [{ name: 'Home', path: '/' }, { name: 'About', path: '/about-us' }, { name: page.h1, path: page.path }];
  const main = `${contentSections(page, ['home', 'roller'], { sidebar: sideCards(ctx, { services: ['exterior-painting', 'interior-painting', 'cabinet-painting-refinishing', 'commercial-painting'] }) })}
${C.faqBlock(page.faqs)}
${relatedTiles(page, ctx)}
<section class="section section-gray"><div class="wrap"><div class="section-head"><h2>More contractor comparisons</h2><p>Buyer’s guides for other painting companies North Central Florida homeowners compare us with — or see <a href="/about-us">how we work</a>.</p></div><div class="city-chips">${(() => { const i = ctx.compare.findIndex((c) => c.path === page.path); return [1, 2, 3, 5].map((k) => ctx.compare[(i + k) % ctx.compare.length]); })().map((c) => `<a href="${c.path}">${esc(c.h1)}</a>`).join('')}</div></div></section>
${C.warrantyBand()}
${C.ctaGray('Compare our written estimate with any other bid')}`;
  return shell(ctx, page, { robots: ctx.robots, crumbsList, hero: C.pageHero({ h1: page.h1, intro: page.heroIntro, img: 'home' }), main, jsonld: graph(page, crumbsList) });
}

function renderCore(page, ctx) {
  const p = page.path;
  const crumbsList = [{ name: 'Home', path: '/' }, { name: page.navLabel || page.h1, path: p }];
  const svc = ctx.services;
  let extraMain = '';
  let layout = 'sections';
  if (p === '/services') {
    const grid = (list, h) => `<section class="section${h.gray ? ' section-gray' : ''}"><div class="wrap"><div class="section-head"><h2>${h.t}</h2></div><div class="cards">${list.map((s) => C.serviceCard(s, svc)).join('')}</div></div></section>`;
    extraMain = grid(site.coreServices, { t: 'Residential &amp; core painting services' }) + grid(site.commercialServices, { t: 'Commercial &amp; institutional painting', gray: true }) + grid(site.specialtyServices, { t: 'Specialty coatings &amp; finishes' });
  } else if (p === '/specialty-services') {
    extraMain = `<section class="section section-gray"><div class="wrap"><div class="section-head"><h2>Specialty coatings &amp; finishes</h2></div><div class="cards">${site.specialtyServices.map((s) => C.serviceCard(s, svc)).join('')}</div></div></section>`;
  } else if (p === '/service-areas') {
    extraMain = `<section class="section section-gray"><div class="wrap"><div class="section-head"><h2>Counties and cities we cover</h2></div><div class="loc-cards three">${site.counties.map((c, i) => `<article class="loc-card"><div class="card-top">${picture(['home', 'commercial', 'roller', 'home', 'cabinet'][i], { sizes: '340px', alt: '' })}<h3>${c.name}</h3></div><div class="card-body"><p>${esc(c.blurb)}</p><ul>${site.cities.filter((x) => x.county === c.slug).map((t) => `<li><a href="/locations/${c.slug}/${t.slug}">${t.name}, FL</a> · <a href="/${t.slug}-fl-painting-services">services</a></li>`).join('')}</ul></div><a class="btn btn-blue read" href="/locations/${c.slug}">Read More</a></article>`).join('')}</div></div></section>`;
  } else if (p === '/our-blog') {
    extraMain = `<section class="section section-gray" id="articles"><div class="wrap"><div class="section-head"><h2>All articles</h2></div><div class="post-grid">${ctx.posts.map(postCard).join('')}</div>
<div class="section-head" style="margin-top:40px"><h3>Browse by category</h3></div><div class="city-chips">${ctx.categories.map((c) => `<a href="${c.path}">${esc(c.name)}</a>`).join('')}</div></div></section>`;
  } else if (p === '/our-gallery') {
    extraMain = `<section class="section section-gray"><div class="wrap"><div class="post-grid">${Object.keys(C.IMG).map((k) => `<figure class="post-card" style="margin:0">${picture(k, { sizes: '(max-width: 620px) 100vw, 360px' })}<figcaption class="pc-body"><p>${esc(C.IMG[k].alt)}</p></figcaption></figure>`).join('')}</div></div></section>`;
  } else if (p === '/about-us') {
    extraMain = `<section class="section section-gray"><div class="wrap"><div class="section-head"><h2>Comparing painting contractors?</h2><p>Side-by-side buyer’s guides for homeowners weighing other North Central Florida painting companies against our written scope.</p></div><div class="city-chips">${ctx.compare.map((c) => `<a href="${c.path}">${esc(c.h1.replace(/ vs\. Precision Paint Experts$/, ''))} vs. Precision</a>`).join('')}</div></div></section>`;
  } else if (p === '/get-a-free-quote' || p === '/contact-us') {
    layout = 'form';
  }
  let body;
  if (layout === 'form') {
    const contact = `<ul class="contact-list"><li>${icon('phone', 'chev')} <a href="${site.phoneHref}">${site.phone}</a></li><li>${icon('mail', 'chev')} <a href="mailto:${site.email}">${site.email}</a></li><li>${icon('pin', 'chev')} ${site.city}, ${site.region} ${site.zip} · serving all of North Central Florida</li><li>${icon('clock', 'chev')} Mon–Fri 9:00 AM – 6:30 PM · Sat &amp; Sun closed</li></ul>`;
    body = `<div class="content-block"><div class="wrap quote-wrap"><div class="prose">${sectionHtml(page.sections[0])}${contact}</div>${C.estimateForm(ctx, { heading: p === '/contact-us' ? 'Send us a message' : 'Tell us about your project' })}</div></div>
${page.sections.length > 1 ? `<div class="content-block"><div class="wrap narrow prose">${page.sections.slice(1).map(sectionHtml).join('')}</div></div>` : ''}`;
  } else if (/privacy|terms/.test(p)) {
    body = `<div class="content-block"><div class="wrap narrow prose">${page.sections.map(sectionHtml).join('')}</div></div>`;
  } else {
    body = contentSections(page, p === '/our-gallery' ? ['cabinet', 'commercial'] : p === '/services' ? ['home', 'commercial'] : ['home', 'roller'], { sidebar: sideCards(ctx, { services: site.coreServices.slice(0, 6) }) });
  }
  const isLegal = /privacy|terms/.test(p);
  const main = `${body}
${extraMain}
${C.faqBlock(page.faqs)}
${isLegal ? '' : relatedTiles(page, ctx)}
${isLegal || layout === 'form' ? '' : C.ctaGray()}`;
  const extra = p === '/about-us' || p === '/contact-us' ? [{ '@type': p === '/about-us' ? 'AboutPage' : 'ContactPage', url: abs(p), about: { '@id': BIZ_ID } }] : [];
  return shell(ctx, page, { robots: ctx.robots, crumbsList, hero: C.pageHero({ h1: page.h1, intro: page.heroIntro, img: p === '/services' ? 'commercial' : 'home', short: isLegal }), main, jsonld: graph(page, crumbsList, extra) });
}

function renderArchive(a, ctx) {
  const label = a.kind === 'tag' ? 'Tag' : 'Category';
  const page = { path: a.path, title: `${a.name} (${label}) — Painting Articles | ${site.name}`, description: `${label} archive: articles from ${site.name} ${a.kind === 'tag' ? 'tagged' : 'filed under'} “${a.name},” with painting and home-care guides for North Central Florida property owners.`, h1: a.name };
  const crumbsList = [{ name: 'Home', path: '/' }, { name: 'Articles', path: '/our-blog' }, { name: a.name, path: a.path }];
  const posts = a.posts.map((p) => ctx.postsByPath[p]).filter(Boolean);
  const main = `<section class="section"><div class="wrap">
  <div class="section-head"><h2>${posts.length ? `${posts.length} article${posts.length > 1 ? 's' : ''} ${a.kind === 'tag' ? 'tagged' : 'in'} “${esc(a.name)}”` : `No articles are filed under “${esc(a.name)}” yet`}</h2>${posts.length ? '' : '<p>Here are our most recent painting guides instead.</p>'}</div>
  <div class="post-grid">${(posts.length ? posts : ctx.posts.slice(0, 6)).map(postCard).join('')}</div>
  <p class="more-link"><a class="btn btn-blue" href="/our-blog">All articles</a></p>
</div></section>${C.ctaGray()}`;
  return shell(ctx, page, { robots: 'noindex, follow', crumbsList, hero: C.pageHero({ h1: a.name, intro: `${a.kind === 'tag' ? 'Tag' : 'Category'} archive — painting guides from a licensed North Central Florida contractor.`, img: 'roller', short: true }), main, jsonld: [] });
}

function render404(ctx) {
  const page = { path: '/404', title: `Page not found | ${site.name}`, description: 'The page you were looking for could not be found.', h1: 'Page not found' };
  const main = `<section class="section"><div class="wrap narrow center"><h2>We couldn’t find that page</h2><p>The link may be old or mistyped. These pages are a good place to start:</p>
<div class="city-chips"><a href="/">Home</a><a href="/services">Painting services</a><a href="/service-areas">Service areas</a><a href="/our-blog">Articles</a><a href="/get-a-free-quote">Free estimate</a><a href="/contact-us">Contact</a></div></div></section>`;
  return shell(ctx, page, { robots: 'noindex, follow', hero: C.pageHero({ h1: 'Page not found', intro: `Call ${site.phone} or use the links below.`, short: true }), main, jsonld: [] });
}

function render(page, ctx) {
  switch (page.type) {
    case 'service': return renderService(page, ctx);
    case 'city': return renderCity(page, ctx);
    case 'cityService': return renderCityService(page, ctx);
    case 'county': return renderCounty(page, ctx);
    case 'post': return renderPost(page, ctx);
    case 'compare': return renderCompare(page, ctx);
    default: return page.path === '/' ? renderHome(page, ctx) : renderCore(page, ctx);
  }
}

module.exports = { render, renderArchive, render404 };
