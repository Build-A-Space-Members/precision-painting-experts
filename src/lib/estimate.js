// Estimate-request handling shared by the Express server and the Vercel function (api/estimate.js).
const site = require('../data/site');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clean = (v, n) => String(v || '').trim().slice(0, n);

// Returns { status, body } where body is { ok, message } or { ok: false, error }.
async function handleEstimate(input = {}, { referer = '' } = {}) {
  if (input.website) return { status: 200, body: { ok: true, message: 'Thanks — your request was received.' } }; // honeypot
  const data = { name: clean(input.name, 100), phone: clean(input.phone, 30), email: clean(input.email, 120), city: clean(input.city, 60), service: clean(input.service, 80), details: clean(input.details, 2000) };
  const problems = [];
  if (!data.name) problems.push('name is required');
  if (data.phone.replace(/\D/g, '').length < 10) problems.push('phone needs a 10-digit number');
  if (!EMAIL.test(data.email)) problems.push('email address is not valid');
  if (!data.city) problems.push('choose the property city');
  if (!data.service) problems.push('choose a service');
  if (problems.length) return { status: 400, body: { ok: false, error: 'Please fix: ' + problems.join('; ') + '.' } };

  if (!process.env.FORM_WEBHOOK_URL) {
    console.warn('[estimate] FORM_WEBHOOK_URL is not set; request NOT delivered:', { ...data, details: data.details.slice(0, 80) });
    return { status: 503, body: { ok: false, error: `Online requests are not connected yet. Please call ${site.phone} or email ${site.email}.` } };
  }
  try {
    const r = await fetch(process.env.FORM_WEBHOOK_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, source: 'precisionpaintexperts.com', page: referer, receivedAt: new Date().toISOString() })
    });
    if (!r.ok) throw new Error('webhook status ' + r.status);
    return { status: 200, body: { ok: true, message: 'Thanks! Your estimate request was sent. A crew lead will contact you to schedule the walkthrough.' } };
  } catch (e) {
    console.error('[estimate] delivery failed:', e.message);
    return { status: 502, body: { ok: false, error: `We could not send your request. Please call ${site.phone}.` } };
  }
}

module.exports = { handleEstimate };
