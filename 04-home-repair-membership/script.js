/* Keystone Home Plan — DEMO template 04. Plain JS, no dependencies.
   Motion: settling, not bouncing. Everything degrades to a complete static page. */
(function () {
  'use strict';
  window.__khpReady = true;

  var doc = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Plan data (placeholders only) ---------- */
  var PLANS = {
    essential: { name: 'Essential', m: '$[89]', a: '$[ANNUAL]', visits: '[2]', hours: '[4]', rate: '$[89]/hr' },
    standard: { name: 'Standard', m: '$[149]', a: '$[ANNUAL]', visits: '[4]', hours: '[8]', rate: '$[79]/hr' },
    whole: { name: 'Whole Home', m: '$[249]', a: '$[ANNUAL]', visits: '[4] + [1]', hours: '[16]', rate: '$[69]/hr' }
  };
  var state = { plan: 'standard', billing: 'm', window: '' };

  /* ---------- Header: condense on scroll, mobile menu ---------- */
  var header = $('[data-header]');
  var joinbar = $('[data-joinbar]');
  function onScroll() {
    var y = window.pageYOffset || doc.scrollTop;
    if (header) header.classList.toggle('is-condensed', y > 24);
    if (joinbar) {
      var max = Math.max(1, doc.scrollHeight - window.innerHeight);
      var on = y / max > 0.4;
      joinbar.classList.toggle('is-on', on);
      document.body.classList.toggle('bar-on', on);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  var burger = $('[data-burger]');
  var mnav = $('[data-mnav]');
  if (burger && mnav) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') !== 'true';
      burger.setAttribute('aria-expanded', String(open));
      mnav.classList.toggle('is-open', open);
    });
    $$('a', mnav).forEach(function (a) {
      a.addEventListener('click', function () { burger.setAttribute('aria-expanded', 'false'); mnav.classList.remove('is-open'); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mnav.classList.contains('is-open')) { burger.setAttribute('aria-expanded', 'false'); mnav.classList.remove('is-open'); burger.focus(); }
    });
  }

  /* ---------- Reveal with 60ms stagger ---------- */
  $$('[data-reveal-group]').forEach(function (g) {
    $$('[data-reveal]', g).forEach(function (el, i) { el.style.setProperty('--i', String(Math.min(i, 8))); });
  });
  var reveals = $$('[data-reveal]');
  function showAll() { reveals.forEach(function (el) { el.classList.add('is-in'); }); $$('[data-tl]').forEach(function (t) { t.classList.add('is-drawn'); }); }
  if (!('IntersectionObserver' in window)) {
    showAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });

    var tio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-drawn'); tio.unobserve(en.target); }
      });
    }, { threshold: 0.2 });
    $$('[data-tl]').forEach(function (t) { if (reduce) t.classList.add('is-drawn'); else tio.observe(t); });

    /* Count-up on hero stat pills. Markup already holds the final value. */
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        cio.unobserve(en.target);
        var el = en.target, end = parseInt(el.getAttribute('data-count'), 10);
        if (reduce || !end) { el.textContent = String(end); return; }
        var t0 = null, dur = 1100;
        (function step(ts) {
          if (!t0) t0 = ts;
          var p = Math.min(1, (ts - t0) / dur);
          var e = 1 - Math.pow(1 - p, 3);
          el.textContent = String(Math.round(end * e));
          if (p < 1) requestAnimationFrame(step);
        })(performance.now());
      });
    }, { threshold: 0.5 });
    $$('[data-count]').forEach(function (el) { cio.observe(el); });
  }
  /* Safety net: if anything is still hidden after 4s (e.g. a long-idle tab), show it. */
  setTimeout(showAll, 4000);

  /* ---------- Billing toggle ---------- */
  function applyBilling() {
    var annual = state.billing === 'a';
    $$('[data-billing]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-billing') === state.billing)); });
    $$('[data-price]').forEach(function (p) {
      var amt = $('.amt', p), per = $('[data-per]', p);
      if (amt) amt.textContent = p.getAttribute(annual ? 'data-a' : 'data-m');
      if (per) per.textContent = annual ? '/yr' : '/mo';
    });
    $$('[data-billing-label]').forEach(function (l) { l.textContent = annual ? 'Billed annually' : 'Billed monthly'; });
    $$('[data-opt-price]').forEach(function (o) { var k = o.getAttribute('data-opt-price'); o.textContent = annual ? PLANS[k].a : PLANS[k].m; });
    $$('[data-opt-per]').forEach(function (o) { o.textContent = annual ? '/yr' : '/mo'; });
    $$('a[href*="plans.html?plan="]').forEach(function (l) {
      var h = l.getAttribute('href').replace(/&billing=a/, '');
      l.setAttribute('href', annual ? h.replace(/(plan=[a-z]+)/, '$1&billing=a') : h);
    });
    var r = $('input[name="billing"][value="' + state.billing + '"]');
    if (r) r.checked = true;
    updateRail();
  }
  $$('[data-billing]').forEach(function (b) {
    b.addEventListener('click', function () { state.billing = b.getAttribute('data-billing'); applyBilling(); });
  });

  /* ---------- Plan selection + live summary rail (plans page) ---------- */
  function priceText() {
    var p = PLANS[state.plan];
    return (state.billing === 'a' ? p.a + '/yr' : p.m + '/mo');
  }
  function updateRail() {
    var p = PLANS[state.plan];
    if (!p) return;
    var set = function (sel, v) { var el = $(sel); if (el) el.textContent = v; };
    set('[data-rail-tier]', p.name);
    set('[data-rail-price]', state.billing === 'a' ? p.a : p.m);
    set('[data-rail-per]', state.billing === 'a' ? '/yr' : '/mo');
    set('[data-rail-billing]', state.billing === 'a' ? 'Annual' : 'Monthly');
    set('[data-rail-visits]', p.visits);
    set('[data-rail-hours]', p.hours);
    set('[data-rail-rate]', p.rate);
    set('[data-rail-window]', state.window || 'Not chosen');
    $$('[data-tier-card]').forEach(function (c) { c.classList.toggle('is-selected', document.body.getAttribute('data-page') === 'plans' && c.getAttribute('data-tier-card') === state.plan); });
  }
  function selectPlan(key) {
    if (!PLANS[key]) return;
    state.plan = key;
    var r = $('input[name="plan"][value="' + key + '"]');
    if (r) r.checked = true;
    updateRail();
  }
  $$('[data-choose]').forEach(function (b) {
    b.addEventListener('click', function () {
      selectPlan(b.getAttribute('data-choose'));
      var j = $('#join');
      if (j) j.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      var first = $('#j-name');
      if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, reduce ? 0 : 500);
    });
  });
  $$('input[name="plan"]').forEach(function (r) { r.addEventListener('change', function () { selectPlan(r.value); }); });
  $$('input[name="billing"]').forEach(function (r) { r.addEventListener('change', function () { state.billing = r.value; applyBilling(); }); });

  try {
    var qs = new URLSearchParams(window.location.search);
    if (qs.get('plan') && PLANS[qs.get('plan')]) state.plan = qs.get('plan');
    if (qs.get('billing') === 'a') state.billing = 'a';
  } catch (e) { /* older browsers: keep defaults */ }
  selectPlan(state.plan);
  applyBilling();

  /* ---------- First-visit windows (demo availability) ---------- */
  var winBox = $('[data-windows]');
  if (winBox) {
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var d = new Date(); d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); /* next Monday */
    var html = '';
    for (var i = 0; i < 6; i++) {
      var s = new Date(d.getTime() + i * 7 * 864e5), e = new Date(s.getTime() + 4 * 864e5);
      var label = 'Week of ' + months[s.getMonth()] + ' ' + s.getDate();
      var range = months[s.getMonth()] + ' ' + s.getDate() + ' – ' + months[e.getMonth()] + ' ' + e.getDate();
      var full = (i === 1 || i === 4);
      html += '<label class="opt"><input type="radio" name="window" value="' + label + '"' + (full ? ' disabled' : '') + ' required><span><b>' + label + '</b><small>' + (full ? 'Full (demo)' : range + ' · weekdays') + '</small></span></label>';
    }
    winBox.innerHTML = html;
    $$('input[name="window"]', winBox).forEach(function (r) {
      r.addEventListener('change', function () { state.window = r.value; updateRail(); clearErr('window'); });
    });
  }

  /* ---------- Form helpers ---------- */
  function setErr(form, name, msg) {
    var p = $('[data-err-for="' + name + '"]', form);
    if (p) p.textContent = msg || '';
    var f = form.elements[name];
    if (f && f.nodeType === 1) {
      var field = f.closest ? f.closest('.field') : null;
      if (field) field.classList.toggle('is-invalid', !!msg);
      if (msg) { f.setAttribute('aria-invalid', 'true'); if (p) { p.id = p.id || ('err-' + name + '-' + Math.random().toString(36).slice(2, 7)); f.setAttribute('aria-describedby', p.id); } }
      else f.removeAttribute('aria-invalid');
    }
  }
  var joinForm = $('[data-join-form]');
  function clearErr(name) { if (joinForm) setErr(joinForm, name, ''); }
  var emailOk = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); };

  /* ---------- Join form: 3 steps ---------- */
  if (joinForm) {
    var steps = $$('[data-step]', joinForm);
    var cur = 1;
    var fill = $('[data-fill]');
    var bar = $('.progress__track');
    var wrap = $('[data-join]');
    function show(n) {
      cur = n;
      steps.forEach(function (s) { s.hidden = Number(s.getAttribute('data-step')) !== n; });
      $$('[data-prog]').forEach(function (li) {
        var k = Number(li.getAttribute('data-prog'));
        li.classList.toggle('is-cur', k === n); li.classList.toggle('is-done', k < n);
      });
      if (fill) fill.style.width = (n / 3 * 100) + '%';
      if (bar) bar.setAttribute('aria-valuenow', String(n));
      if (n === 3) fillSummary();
      var lg = $('[data-step="' + n + '"] legend', joinForm);
      if (wrap) wrap.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      if (lg) { lg.setAttribute('tabindex', '-1'); setTimeout(function () { lg.focus({ preventScroll: true }); }, reduce ? 0 : 350); }
    }
    function validate(n) {
      var ok = true, F = joinForm.elements, first = null;
      function need(name, cond, msg) { setErr(joinForm, name, cond ? '' : msg); if (!cond) { ok = false; if (!first) first = name; } }
      if (n === 1) {
        need('plan', !!$('input[name="plan"]:checked', joinForm), 'Choose a plan to continue.');
        need('name', F.name.value.trim().length > 1, 'Enter your full name.');
        need('email', emailOk(F.email.value.trim()), 'Enter a valid email address.');
        need('phone', F.phone.value.replace(/\D/g, '').length >= 10, 'Enter a phone number with area code.');
      }
      if (n === 2) {
        need('address', F.address.value.trim().length > 4, 'Enter the property address.');
        need('ptype', !!F.ptype.value, 'Choose a property type.');
        var y = F.year.value.trim();
        need('year', !y || (/^\d{4}$/.test(y) && +y > 1700 && +y <= new Date().getFullYear()), 'Enter a four-digit year, or leave it blank.');
        need('window', !!$('input[name="window"]:checked', joinForm), 'Choose a first-visit window.');
      }
      if (n === 3) {
        need('agree', F.agree.checked, 'Please confirm you have read the membership terms.');
      }
      if (!ok && first) {
        var el = F[first];
        if (el && el.length && !el.nodeType) el = el[0];
        if (first === 'window') el = $('input[name="window"]:not(:disabled)', joinForm);
        if (el && el.focus) el.focus();
      }
      return ok;
    }
    function fillSummary() {
      var F = joinForm.elements;
      var set = function (k, v) { var el = $('[data-s="' + k + '"]', joinForm); if (el) el.textContent = v; };
      set('plan', PLANS[state.plan].name + ' · ' + (state.billing === 'a' ? 'annual' : 'monthly'));
      set('price', priceText());
      set('window', state.window || '—');
      set('address', F.address.value.trim() || '—');
    }
    $$('[data-next]', joinForm).forEach(function (b) { b.addEventListener('click', function () { if (validate(cur)) show(cur + 1); }); });
    $$('[data-prev]', joinForm).forEach(function (b) { b.addEventListener('click', function () { show(cur - 1); }); });
    ['name', 'email', 'phone', 'address', 'ptype', 'year'].forEach(function (n) {
      var f = joinForm.elements[n]; if (f) f.addEventListener('input', function () { setErr(joinForm, n, ''); });
    });
    joinForm.elements.agree.addEventListener('change', function () { setErr(joinForm, 'agree', ''); });
    joinForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(3)) return;
      var c = $('[data-confirm]', wrap);
      var cp = $('[data-c-plan]', c); if (cp) cp.textContent = PLANS[state.plan].name;
      joinForm.hidden = true;
      var prog = $('.progress', wrap); if (prog) prog.hidden = true;
      c.hidden = false; c.focus();
    });
    var restart = $('[data-restart]', wrap);
    if (restart) restart.addEventListener('click', function () {
      joinForm.reset(); state.window = ''; selectPlan(state.plan); applyBilling();
      $('[data-confirm]', wrap).hidden = true; joinForm.hidden = false;
      var prog = $('.progress', wrap); if (prog) prog.hidden = false;
      show(1);
    });
  }

  /* ---------- Contact form ---------- */
  var cForm = $('[data-contact-form]');
  if (cForm) {
    cForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var F = cForm.elements, ok = true, first = null;
      function need(n, cond, msg) { setErr(cForm, n, cond ? '' : msg); if (!cond) { ok = false; if (!first) first = n; } }
      need('name', F.name.value.trim().length > 1, 'Enter your name.');
      need('email', emailOk(F.email.value.trim()), 'Enter a valid email address.');
      need('message', F.message.value.trim().length > 4, 'Add a short message.');
      if (!ok) { F[first].focus(); return; }
      var box = $('[data-contact]');
      cForm.hidden = true;
      var c = $('[data-confirm]', box); c.hidden = false; c.focus();
    });
    ['name', 'email', 'message'].forEach(function (n) { cForm.elements[n].addEventListener('input', function () { setErr(cForm, n, ''); }); });
    var rs = $('[data-contact] [data-restart]');
    if (rs) rs.addEventListener('click', function () { cForm.reset(); cForm.hidden = false; $('[data-contact] [data-confirm]').hidden = true; cForm.elements.name.focus(); });
  }
})();
