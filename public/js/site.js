// Header behavior, mobile menu, and the estimate form (progressive enhancement:
// the form also works as a plain POST without JavaScript).
(function () {
  'use strict';
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.menu-toggle');
  var mobile = document.getElementById('mobile-nav');

  if (toggle && mobile) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
      mobile.classList.toggle('open', !open);
      header.classList.toggle('menu-open', !open);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobile.classList.contains('open')) { toggle.click(); toggle.focus(); }
    });
  }

  // Header turns solid and sticks once the hero scrolls away (Spray Tex style overlay header).
  if (header && !header.classList.contains('solid')) {
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 140); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---------- estimate form ----------
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function validate(form) {
    var d = new FormData(form);
    var problems = [];
    if (!String(d.get('name') || '').trim()) problems.push('name is required');
    var phone = String(d.get('phone') || '').replace(/\D/g, '');
    if (phone.length < 10) problems.push('phone needs a 10-digit number');
    if (!EMAIL.test(String(d.get('email') || '').trim())) problems.push('email address is not valid');
    if (!d.get('city')) problems.push('choose the property city');
    if (!d.get('service')) problems.push('choose a service');
    return problems;
  }
  function setStatus(form, ok, msg) {
    var el = form.querySelector('.form-status');
    if (!el) return;
    el.className = 'form-status ' + (ok ? 'ok' : 'err');
    el.textContent = msg;
  }
  document.querySelectorAll('form.js-estimate').forEach(function (form) {
    var params = new URLSearchParams(location.search);
    if (params.get('error')) setStatus(form, false, 'Your request could not be sent online. Please call (386) 854-7139.');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var problems = validate(form);
      var result;
      if (problems.length) {
        result = Promise.resolve({ ok: false, error: 'Please fix: ' + problems.join('; ') + '.' });
      } else {
        var btn = form.querySelector('button[type=submit]');
        if (btn) btn.disabled = true;
        result = fetch(form.action, { method: 'POST', headers: { Accept: 'application/json' }, body: new URLSearchParams(new FormData(form)) })
          .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'Unexpected server response.' }; }); })
          .catch(function () { return { ok: false, error: 'Network error. Please call (386) 854-7139.' }; })
          .then(function (r) { if (btn) btn.disabled = false; return r; });
      }
      result.then(function (r) {
        setStatus(form, r.ok, r.ok ? r.message : r.error);
        if (r.ok) form.reset();
      });
      // WebMCP: hand the outcome back to an agent that submitted the form.
      if (e.agentInvoked && typeof e.respondWith === 'function') e.respondWith(result);
    });
  });
})();
