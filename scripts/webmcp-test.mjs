// Browser test for a site's WebMCP tools. Copy to scripts/webmcp-test.mjs (the .mjs extension
// makes it an ES module even in a CommonJS project) and edit the CHECKS section.
//   Start the site with a local form webhook so the estimate form can really deliver:
//     FORM_WEBHOOK_URL=http://localhost:4199/hook PORT=3000 npm start
//   node scripts/webmcp-test.mjs [baseUrl]           # default http://localhost:$PORT or 3000
// This script listens on :4199 (HOOK_PORT) and checks the request actually arrives.
//
// Browsers without WebMCP get a small stand-in for document.modelContext that follows the
// spec's registerTool / getTools / executeTool shapes, so the site's real code runs unchanged.
// On a Chrome build with WebMCP enabled, the native API is used instead (set CHROME_PATH).
// Needs Playwright: npm i -D playwright (or a global install).
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import path from 'node:path';
import http from 'node:http';

// Find Playwright: project install, PLAYWRIGHT_PATH, then the global npm root.
const require = createRequire(import.meta.url);
let chromium;
const candidates = ['playwright', process.env.PLAYWRIGHT_PATH];
try { candidates.push(path.join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'playwright')); } catch { /* no npm */ }
for (const c of candidates.filter(Boolean)) {
  try { ({ chromium } = require(c)); break; } catch { /* try next */ }
}
if (!chromium) { console.error('Playwright not found: npm i -D playwright (or set PLAYWRIGHT_PATH)'); process.exit(2); }
const BASE = (process.argv[2] || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');

const STAND_IN = () => {
  if (document.modelContext || navigator.modelContext) return;
  const tools = new Map();
  const mc = new EventTarget();
  mc.registerTool = async (tool, opts = {}) => {
    if (!tool?.name || !tool?.description || typeof tool.execute !== 'function') throw new TypeError('Invalid tool');
    if (tools.has(tool.name)) throw new DOMException(`Tool ${tool.name} already registered`, 'InvalidStateError');
    tools.set(tool.name, tool);
    opts.signal?.addEventListener('abort', () => tools.delete(tool.name));
    mc.dispatchEvent(new Event('toolchange'));
  };
  // Declarative tools: synthesize a schema from <form toolname> the way the browser does
  // (toolparamdescription → <label> → aria-description; required; <select> options as enum).
  const labelOf = (el) => el.getAttribute('toolparamdescription') || (el.labels?.[0]?.textContent || '').trim() || el.getAttribute('aria-description') || el.name;
  const formTool = (f) => {
    const properties = {}; const required = [];
    for (const el of f.elements) {
      if (!el.name || ['submit', 'button', 'reset', 'hidden'].includes(el.type) || properties[el.name]) continue;
      const prop = { type: el.type === 'number' ? 'number' : el.type === 'checkbox' ? 'boolean' : 'string', description: labelOf(el) };
      if (el.tagName === 'SELECT') prop.enum = [...el.options].map((o) => o.value).filter(Boolean);
      properties[el.name] = prop;
      if (el.required) required.push(el.name);
    }
    return { name: f.getAttribute('toolname'), description: f.getAttribute('tooldescription'), inputSchema: { type: 'object', properties, required }, declarative: true, autosubmit: f.hasAttribute('toolautosubmit'), form: f };
  };
  const forms = () => [...document.querySelectorAll('form[toolname][tooldescription]')].map(formTool);
  // Fill the form (firing input/change so React/Vue state updates), dispatch an agent-invoked
  // submit, and return what the page passed to respondWith(). { noResponse: true } means the
  // submit handler never called respondWith synchronously — a bug in the handler.
  const runForm = (t, input) => new Promise((resolve) => {
    const f = t.form;
    for (const [k, v] of Object.entries(input || {})) {
      const el = f.elements[k];
      if (!el) return resolve({ error: `no field ${k}` });
      if (el.type === 'checkbox' || el.type === 'radio') el.checked = !!v; else el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const ev = new SubmitEvent('submit', { cancelable: true, bubbles: true });
    Object.defineProperty(ev, 'agentInvoked', { value: true });
    let responded = false;
    ev.respondWith = (p) => { responded = true; Promise.resolve(p).then(resolve, (e) => resolve({ rejected: String(e) })); };
    f.dispatchEvent(ev);
    if (!responded) resolve({ noResponse: true });
  });
  mc.getTools = async () => [
    ...[...tools.values()].map(({ name, title, description, inputSchema, annotations }) => ({ name, title, description, inputSchema, annotations })),
    ...forms().map(({ name, description, inputSchema, declarative, autosubmit }) => ({ name, description, inputSchema, declarative, autosubmit })),
  ];
  mc.executeTool = async (tool, input = {}) => {
    const t = tools.get(tool.name);
    if (t) return JSON.stringify(await t.execute(input, { signal: new AbortController().signal }));
    const f = forms().find((x) => x.name === tool.name);
    if (f) return JSON.stringify(await runForm(f, input));
    throw new DOMException(`No tool ${tool.name}`, 'NotFoundError');
  };
  Object.defineProperty(Document.prototype, 'modelContext', { get: () => mc, configurable: true });
  window.__webmcpStandIn = true;
};

const failures = [];
const check = (ok, label, detail = '') => {
  console.log(`${ok ? '✓' : '✗'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures.push(label);
};

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const ctx = await browser.newContext();
await ctx.addInitScript(STAND_IN);
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
// Blocked third-party embeds produce "Failed to load resource" — not script errors.
page.on('console', (m) => { if ((m.type() === 'error' && !m.text().startsWith('Failed to load resource')) || m.text().startsWith('[webmcp]')) errors.push(m.text()); });

const listTools = () => page.evaluate(async () => (await (document.modelContext || navigator.modelContext).getTools()));
const call = (name, input) => page.evaluate(async ([n, i]) => {
  const mc = document.modelContext || navigator.modelContext;
  const tool = (await mc.getTools()).find((t) => t.name === n);
  if (!tool) throw new Error(`tool ${n} not registered`);
  return JSON.parse(await mc.executeTool(tool, i));
}, [name, input]);
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
console.log(`WebMCP: ${(await page.evaluate(() => window.__webmcpStandIn === true)) ? 'spec stand-in' : 'native browser API'}\n`);

// ======================= CHECKS — Precision Paint Experts =======================
const hooks = [];
const HOOK_PORT = Number(process.env.HOOK_PORT || 4199);
const hookServer = http.createServer((req, res) => { let b = ''; req.on('data', (c) => { b += c; }); req.on('end', () => { try { hooks.push(JSON.parse(b)); } catch { hooks.push(b); } res.end('ok'); }); });
await new Promise((r) => hookServer.listen(HOOK_PORT, r));

const EXPECTED = ['search_services', 'get_service_details', 'check_service_area', 'search_articles', 'get_contact_options', 'open_page'];
const tools = (await listTools()).filter((t) => !t.declarative);
check(tools.map((t) => t.name).sort().join() === [...EXPECTED].sort().join(), 'expected tools registered', tools.map((t) => t.name).join(', '));
check(tools.every((t) => t.description.length > 40 && t.inputSchema?.type === 'object'), 'descriptions and object schemas');

for (const [q, want] of [
  ['paint my kitchen cabinets', /cabinet/i],
  ['power wash the driveway', /pressure/i],
  ['peeling stucco cracks', /stucco/i],
  ['remove popcorn ceiling', /popcorn|ceiling/i],
  ['garage floor coating', /epoxy|garage/i],
  ['paint our office building', /office|commercial/i],
  ['stain my fence', /fence|deck/i],
]) {
  const r = await call('search_services', { query: q });
  check(want.test(r.services[0]?.name || ''), `search "${q}"`, r.services[0]?.name || r.note);
}
check((await call('search_services', { query: 'zzzz' })).note, 'no-match returns a helpful note');

const d = await call('get_service_details', { service: 'cabinet painting' });
check(!d.error && d.url?.startsWith(BASE) && /no published prices/i.test(d.pricing || ''), 'details: absolute URL and honest pricing note', d.name);
check((await call('get_service_details', { service: 'qqqq' })).error, 'unknown service returns an error message');

const zipIn = await call('check_service_area', { place: '32669' });
check(zipIn.served === true && /Newberry/.test(zipIn.serviceCity || ''), 'served ZIP recognised', zipIn.serviceCity);
check((await call('check_service_area', { place: 'painters in High Springs FL' })).served === true, 'city name inside a sentence recognised');
check((await call('check_service_area', { place: 'Levy County' })).served === true, 'county recognised');
check((await call('check_service_area', { place: 'Miami' })).served === false, 'city outside the area is not served');

const art = await call('search_articles', { query: 'paint bubbling on drywall' });
check(/bubbl/i.test(art.articles[0]?.title || ''), 'article search finds the drywall bubbling guide', art.articles[0]?.title);

const contact = await call('get_contact_options', {});
check(contact.phone === '(386) 854-7139' && contact.email, 'contact options returned');
check((await call('open_page', { url: 'https://example.com/' })).error, 'open_page refuses off-site URLs');
check((await call('open_page', { url: '/not-a-real-page' })).error, 'open_page refuses unknown paths');
const target = new URL(d.url).pathname;
await call('open_page', { url: target });
await page.waitForURL((u) => u.pathname === target, { timeout: 10000 }).then(() => check(true, 'open_page navigates on-site', target), () => check(false, 'open_page navigates on-site', target));

await page.goto(`${BASE}/get-a-free-quote`, { waitUntil: 'networkidle' });
const formTool = (await listTools()).find((t) => t.name === 'request_estimate');
check(formTool && formTool.inputSchema.required.length > 0 && Object.values(formTool.inputSchema.properties).every((p) => p.description), 'declarative form registers with described, required fields', formTool && Object.keys(formTool.inputSchema.properties).join(', '));
check(formTool && !formTool.autosubmit, 'form that sends something does not auto-submit');
const bad = await call('request_estimate', { name: '', email: 'not-an-email' });
check(bad && bad.ok === false && bad.error, 'invalid input is reported back, not sent', JSON.stringify(bad));
check(hooks.length === 0, 'invalid submission did not reach the webhook');
const ok = await call('request_estimate', { name: 'Test Agent', phone: '(352) 555-0100', email: 'test@example.com', city: 'Ocala', service: 'Exterior painting', details: 'Automated WebMCP test — ignore.' });
check(ok && ok.ok === true, 'valid agent submission is accepted and answered', JSON.stringify(ok));
check(/sent|thank/i.test(await page.locator('#form-status').textContent() || ''), 'confirmation is visible on the page');
check(hooks.length === 1 && hooks[0].city === 'Ocala', 'request delivered to the webhook', JSON.stringify(hooks[0] || {}).slice(0, 80));
hookServer.close();
// ===========================================================================


check(errors.length === 0, 'no page errors or registration warnings', errors.join(' | '));
await browser.close();
console.log(failures.length ? `\n${failures.length} check(s) failed` : '\nAll WebMCP checks passed');
process.exit(failures.length ? 1 : 0);
