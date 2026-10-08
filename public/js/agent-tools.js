// WebMCP tools for Precision Paint Experts. Lets AI agents in the visitor's browser look things
// up and move around the site through named actions instead of guessing at clicks.
// Spec: https://github.com/webmachinelearning/webmcp. This is a progressive enhancement:
// browsers without WebMCP do nothing here.
(function () {
  'use strict';
  var mc = document.modelContext || navigator.modelContext; // spec: document; early Chrome: navigator
  if (!mc || typeof mc.registerTool !== 'function') return;

  // ---------- catalog (built at deploy time, fetched on first tool call) ----------
  var script = document.currentScript;
  var catalogUrl = (script && script.getAttribute('data-catalog')) || '/agent/catalog.json';
  var catalog = null;
  function load() {
    if (!catalog) {
      catalog = fetch(catalogUrl, { credentials: 'same-origin' }).then(function (r) {
        if (!r.ok) throw new Error('Catalog unavailable (' + r.status + ')');
        return r.json();
      });
      catalog.catch(function () { catalog = null; }); // allow a retry on the next call
    }
    return catalog;
  }

  // ---------- matching helpers ----------
  // SYN rewrites a customer word to the word your content uses; '' drops it. Example entries
  // are generic; replace them with this business's vocabulary.
  var SYN_RAW = { kitchen: 'cabinet', cupboard: 'cabinet', siding: 'exterior', outside: 'exterior', inside: 'interior', walls: 'interior', room: 'interior', power: 'pressure', wash: 'washing', powerwash: 'pressure', popcorn: 'popcorn', acoustic: 'popcorn', texture: 'popcorn', epoxy: 'epoxy', garage: 'epoxy', graffiti: 'graffiti', business: 'commercial', store: 'retail', restaurant: 'retail', apartment: 'multi', condo: 'multi', hoa: 'hoa', church: 'church', school: 'church', stain: 'staining', fence: 'fence', deck: 'deck', colour: 'color', colors: 'color', limewash: 'faux', plaster: 'faux', shutters: 'shutter', doors: 'door', baseboard: 'trim', crown: 'trim', patch: 'drywall', sheetrock: 'drywall', cost: '', price: '', quote: '', estimate: '', near: '', cheap: '', service: '', company: '', painter: '', painting: '', paint: '', precision: '', expert: '', florida: '', fl: '', book: '', appointment: '' };
  var STOP = { the: 1, a: 1, an: 1, for: 1, to: 1, of: 1, in: 1, on: 1, and: 1, or: 1, i: 1, me: 1, my: 1, we: 1, our: 1, you: 1, your: 1, can: 1, how: 1, what: 1, do: 1, does: 1, need: 1, get: 1, is: 1, much: 1 };
  function norm(s) { return String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  // Light stemming so "windows"/"window", "cleaning"/"clean", "shedding"/"shed" meet.
  // Applied to the query, the content and the SYN map alike.
  function stem(w) {
    if (w.length > 5 && /ing$/.test(w)) {
      w = w.slice(0, -3);
      return /([^aeioulsz])\1$/.test(w) ? w.slice(0, -1) : w; // shedd → shed, but fill → fill
    }
    if (w.length > 4 && /ies$/.test(w)) return w.slice(0, -3) + 'y';
    if (w.length > 4 && /(sh|ch|x|ss)es$/.test(w)) return w.slice(0, -2);
    if (w.length > 3 && /[^s]s$/.test(w)) return w.slice(0, -1);
    return w;
  }
  var SYN = {};
  Object.keys(SYN_RAW).forEach(function (k) { SYN[stem(norm(k))] = SYN_RAW[k] && stem(norm(SYN_RAW[k])); });
  function tokens(s) {
    return norm(s).split(' ').filter(function (t) { return t && !STOP[t]; }).map(stem)
      .map(function (t) { return Object.prototype.hasOwnProperty.call(SYN, t) ? SYN[t] : t; })
      .filter(Boolean);
  }
  // fields: [[text, weight], ...]. Whole-phrase hit = 3× weight; each query word found as a word
  // (or word prefix, so "insp" finds "inspection") = 1× weight.
  function score(q, fields) {
    var qt = tokens(q);
    if (!qt.length) return 0;
    var phrase = norm(q);
    var total = 0;
    fields.forEach(function (f) {
      var text = norm(f[0]);
      if (!text) return;
      if (phrase.length > 3 && text.indexOf(phrase) >= 0) total += f[1] * 3;
      var words = ' ' + text.split(' ').map(stem).join(' ') + ' ';
      qt.forEach(function (t) { if (words.indexOf(' ' + t) >= 0) total += f[1]; });
    });
    return total;
  }
  function top(list, q, fieldsOf, n) {
    return list.map(function (x) { return { x: x, s: score(q, fieldsOf(x)) }; })
      .filter(function (r) { return r.s > 0; })
      .sort(function (a, b) { return b.s - a.s; })
      .slice(0, n).map(function (r) { return r.x; });
  }
  function abs(path) { return path ? location.origin + path : null; }
  function clampInt(v, d, lo, hi) { v = parseInt(v, 10); return isNaN(v) ? d : Math.max(lo, Math.min(hi, v)); }
  function findService(cat, q) {
    var slug = norm(q).replace(/ /g, '-');
    return cat.services.find(function (x) { return x.slug === slug || norm(x.name) === norm(q); })
      || top(cat.services, q, function (x) { return [[x.name, 4], [(x.keywords || []).join(' '), 2]]; }, 1)[0] || null;
  }
  // Prices always travel with their unit and a human label, never as a bare number.
  function allPaths(cat) {
    // Every on-site path the agent may open. Include each list your catalog has.
    var acc = {};
    [cat.pages, cat.services, cat.articles, cat.serviceArea && cat.serviceArea.cities, cat.serviceArea && cat.serviceArea.counties].forEach(function (list) {
      (list || []).forEach(function (p) { if (p.page) acc[p.page] = 1; if (p.servicesPage) acc[p.servicesPage] = 1; });
    });
    acc[cat.business.contactPage] = 1;
    if (cat.business.requestPage) acc[cat.business.requestPage] = 1;
    return acc;
  }

  // ---------- tools ----------
  var tools = [
    {
      name: 'search_services',
      title: 'Search painting services',
      description: 'Searches the painting and coating services Precision Paint Experts offers in North Central Florida and returns matching services with a short summary and page URL. Use it when the visitor describes a job in their own words (e.g. "kitchen cabinets", "peeling stucco", "garage floor").',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'What the visitor needs, in their own words.' },
          maxResults: { type: 'integer', description: 'How many to return (1-10). Defaults to 5.' }
        },
        required: ['query']
      },
      annotations: { readOnlyHint: true },
      execute: function (input) {
        return load().then(function (cat) {
          var q = String((input && input.query) || '');
          var hits = top(cat.services, q, function (s) { return [[s.name, 4], [(s.keywords || []).join(' '), 2], [s.summary, 1]]; }, clampInt(input && input.maxResults, 5, 1, 10));
          return {
            query: q,
            services: hits.map(function (s) { return { name: s.name, summary: s.summary, url: abs(s.page) }; }),
            pricing: cat.business.pricing,
            allServices: hits.length ? undefined : cat.services.map(function (s) { return s.name; }),
            note: hits.length ? undefined : 'No close match. These are all the services offered; or use get_contact_options to ask the team.'
          };
        });
      }
    },
    {
      name: 'get_service_details',
      title: 'Service details',
      description: 'Returns details for one painting service: summary, what is typically included, common questions with answers, the service page and the free-estimate page. Accepts the service name or URL slug. Prices are not published; estimates are free and written.',
      inputSchema: { type: 'object', properties: { service: { type: 'string', description: 'Service name or slug, e.g. "cabinet painting" or "pressure-washing".' } }, required: ['service'] },
      annotations: { readOnlyHint: true },
      execute: function (input) {
        return load().then(function (cat) {
          var s = findService(cat, String((input && input.service) || ''));
          if (!s) return { error: 'No service matched. Use search_services first.', services: cat.services.map(function (x) { return x.name; }) };
          return { name: s.name, summary: s.summary, includes: s.includes, faqs: s.faqs, pricing: cat.business.pricing, url: abs(s.page), requestUrl: abs(cat.business.requestPage) };
        });
      }
    },
    {
      name: 'check_service_area',
      title: 'Check service area',
      description: 'Checks whether a Florida city, county or ZIP code is in the North Central Florida area Precision Paint Experts serves (Alachua, Marion, Levy, Columbia and Gilchrist counties) and returns the matching local page. Also lists the cities served.',
      inputSchema: { type: 'object', properties: { place: { type: 'string', description: 'A city, county or 5-digit ZIP code, e.g. "Ocala", "Levy County" or "32669".' } }, required: ['place'] },
      annotations: { readOnlyHint: true },
      execute: function (input) {
        return load().then(function (cat) {
          var raw = String((input && input.place) || '').trim();
          var cities = cat.serviceArea.cities;
          var served = cities.map(function (c) { return c.name + ', FL (' + c.county + ')'; });
          if (!raw) return { error: 'Give a city, county or 5-digit ZIP code.', areasServed: served };
          var n = ' ' + norm(raw) + ' ';
          var zip = (raw.match(/\b\d{5}\b/) || [])[0];
          var city = zip ? cities.find(function (c) { return c.zips.indexOf(zip) >= 0; })
            : cities.slice().sort(function (a, b) { return b.name.length - a.name.length; }).find(function (c) { return n.indexOf(' ' + norm(c.name) + ' ') >= 0; });
          var county = !city && cat.serviceArea.counties.find(function (c) { return n.indexOf(' ' + norm(c.name.replace(/ County$/, '')) + ' ') >= 0; });
          var status = document.getElementById('service-area-status');
          var answer = city ? 'Yes — ' + city.name + ', FL is in our service area (' + city.county + ').'
            : county ? 'Yes — we serve ' + county.name + ', FL.'
            : 'Not on our listed route. Call to confirm: ' + cat.business.phone + '.';
          if (status) status.textContent = answer;
          return {
            place: raw, served: !!(city || county), answer: answer,
            serviceCity: city ? city.name + ', FL' : undefined,
            locationPageUrl: city ? abs(city.page) : county ? abs(county.page) : undefined,
            localServicesUrl: city ? abs(city.servicesPage) : undefined,
            areasServed: city || county ? undefined : served,
            note: zip && !city ? 'Only one ZIP per city is listed; a nearby ZIP may still be served. Ask by city name or call.' : undefined
          };
        });
      }
    },
    {
      name: 'search_articles',
      title: 'Search painting guides',
      description: 'Searches Precision Paint Experts’ painting and home-care articles for North Central Florida (peeling paint, mildew, stucco cracks, cabinet painting, deck rot and similar) and returns titles, summaries and URLs.',
      inputSchema: { type: 'object', properties: { query: { type: 'string', description: 'Topic or problem, e.g. "paint bubbling on drywall".' }, maxResults: { type: 'integer', description: '1-10, default 5.' } }, required: ['query'] },
      annotations: { readOnlyHint: true },
      execute: function (input) {
        return load().then(function (cat) {
          var q = String((input && input.query) || '');
          var hits = top(cat.articles, q, function (a) { return [[a.title, 4], [a.category, 2], [a.summary, 1]]; }, clampInt(input && input.maxResults, 5, 1, 10));
          return { query: q, articles: hits.map(function (a) { return { title: a.title, summary: a.summary, published: a.date, url: abs(a.page) }; }), note: hits.length ? undefined : 'No match. Try a symptom such as "peeling", "mildew", "cracks" or "cabinets".' };
        });
      }
    },
    {
      name: 'get_contact_options',
      title: 'Contact the team',
      description: 'Returns phone, email, business hours and the free-estimate page for Precision Paint Experts. If this page has the estimate form, scrolls it into view so the visitor can review and send it themselves.',
      inputSchema: { type: 'object', properties: {} },
      annotations: { readOnlyHint: true },
      execute: function () {
        return load().then(function (cat) {
          var form = document.getElementById('contact-form');
          if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
          var b = cat.business;
          return { phone: b.phone, email: b.email, hours: b.hours, basedIn: b.basedIn, estimatePageUrl: abs(b.requestPage), contactPageUrl: abs(b.contactPage), formShown: !!form };
        });
      }
    },
    {
      name: 'open_page',
      title: 'Open a page',
      description: 'Navigates the visitor’s tab to a page on this site, such as a service page, a city page, an article or the free-estimate page. Only accepts URLs on this site, such as those returned by the other tools.',
      inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'A URL or path on this site.' } }, required: ['url'] },
      execute: function (input) {
        return load().then(function (cat) {
          var p = null;
          try {
            var u = new URL(String((input && input.url) || ''), location.origin);
            if (u.origin === location.origin) p = u.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
          } catch (e) { /* invalid URL */ }
          if (!p || !allPaths(cat)[p]) return { error: 'That is not a page on this site. Use a URL returned by another tool.' };
          setTimeout(function () { location.assign(p); }, 50);
          return { navigatingTo: abs(p) };
        });
      }
    }
  ];

  tools.forEach(function (t) {
    try {
      var p = mc.registerTool(t);
      if (p && typeof p.catch === 'function') p.catch(function (e) { console.warn('[webmcp] ' + t.name + ': ' + e.message); });
    } catch (e) { console.warn('[webmcp] ' + t.name + ': ' + e.message); }
  });
})();
