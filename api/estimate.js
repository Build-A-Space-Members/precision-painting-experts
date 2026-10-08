// Vercel serverless function for POST /api/estimate (same logic as the Express route).
const { handleEstimate } = require('../src/lib/estimate');

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false, error: 'POST only' }); }
  let body = req.body || {};
  if (typeof body === 'string') body = Object.fromEntries(new URLSearchParams(body));
  const { status, body: out } = await handleEstimate(body, { referer: req.headers.referer || '' });
  if ((req.headers.accept || '').includes('application/json')) return res.status(status).json(out);
  res.statusCode = 303;
  res.setHeader('Location', out.ok ? '/estimate-results?sent=1' : '/get-a-free-quote?error=1#estimate-form');
  return res.end();
};
