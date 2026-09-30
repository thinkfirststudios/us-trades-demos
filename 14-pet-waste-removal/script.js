/* Scoopline Yard Service — DEMO template 14 · ThinkFirst Studios
   Front-end only. No data leaves the browser. Every figure is a bracketed
   placeholder; the calculator uses DEMO rates purely so the numbers move. */
(function () {
  'use strict';

  var RM = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function reduced() { return RM.matches; }
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  var store = {
    get: function (k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } },
    del: function (k) { try { sessionStorage.removeItem(k); } catch (e) { /* noop */ } }
  };
  function scrollToEl(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
  }

  /* ---------------- header: condense past 120px ---------------- */
  var hdr = $('.hdr');
  function onScroll() { if (hdr) hdr.classList.toggle('is-condensed', window.scrollY > 120); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------- mobile menu ---------------- */
  var menuBtn = $('.menu-btn'), mnav = $('#mnav');
  if (menuBtn && mnav) {
    menuBtn.addEventListener('click', function () {
      var open = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', String(!open));
      mnav.classList.toggle('is-open', !open);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mnav.classList.contains('is-open')) {
        mnav.classList.remove('is-open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.focus();
      }
    });
  }

  /* ---------------- reveals (fade + 10px rise, 50ms stagger) ---------------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.01 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    document.documentElement.classList.add('reveal-all');
  }

  /* ---------------- count-up on route stats ---------------- */
  var counts = $$('.count');
  function runCount(el) {
    var to = parseInt(el.getAttribute('data-to'), 10) || 0;
    if (reduced()) { el.textContent = String(to); return; }
    var t0 = null, dur = 900;
    el.textContent = '0';
    function tick(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(to * e));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ('IntersectionObserver' in window && counts.length) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { runCount(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.4 });
    counts.forEach(function (el) { cio.observe(el); });
  }

  /* ================================================================
     QUOTE STATE — DEMO rates only. Replace with the client's pricing.
     ================================================================ */
  var SIZES = {
    small:   { label: 'Small yard',   band: 'under [4,000] sq ft',        base: 18 },
    medium:  { label: 'Medium yard',  band: '[4,000–10,000] sq ft',       base: 22 },
    large:   { label: 'Large yard',   band: '[10,000] sq ft – [1] acre',  base: 27 },
    acreage: { label: 'Acreage',      band: 'over [1] acre',              base: 34 }
  };
  var FREQ = {
    weekly:   { label: 'Weekly',           mult: 1.0,  visits: 4 },
    biweekly: { label: 'Every other week', mult: 1.3,  visits: 2 },
    twice:    { label: 'Twice weekly',     mult: 0.85, visits: 8 },
    oneoff:   { label: 'One-time cleanup', oneoff: true }
  };
  var DOG_ADD = 4, FIRST_FEE = 35, ONEOFF_BASE = 55, ONEOFF_DOG = 6, MAX_DOGS = 7;
  var DEFAULT_Q = { size: 'medium', dogs: 2, freq: 'weekly', first: true };
  var q = Object.assign({}, DEFAULT_Q, store.get('scoop_quote') || {});
  if (!SIZES[q.size]) q.size = 'medium';
  if (!FREQ[q.freq]) q.freq = 'weekly';
  q.dogs = Math.max(1, Math.min(MAX_DOGS, parseInt(q.dogs, 10) || 2));

  function money(n) { return '$[' + n + ']'; }
  function dogsLabel(d) { return d >= MAX_DOGS ? '[7+] dogs — CONFIRM' : '[' + d + '] ' + (d === 1 ? 'dog' : 'dogs'); }
  function calc() {
    var s = SIZES[q.size], f = FREQ[q.freq], extra = q.dogs - 1;
    var r = { lines: [], oneoff: !!f.oneoff };
    if (f.oneoff) {
      var base = ONEOFF_BASE + s.base, dogAdd = extra * ONEOFF_DOG;
      r.lines.push(['One-time cleanup · ' + s.label, money(base)]);
      r.lines.push([dogsLabel(q.dogs), extra ? '+' + money(dogAdd) : 'incl.']);
      r.lines.push(['Per [30] days since last cleanup [CONFIRM]', '+$[XX]']);
      if (q.size === 'acreage') r.lines.push(['Per additional [1/4] acre [CONFIRM]', '+$[XX]']);
      r.total = base + dogAdd; r.per = 'from · one time'; r.month = null;
    } else {
      var pv = Math.round((s.base + extra * DOG_ADD) * f.mult);
      r.lines.push([s.label + ' · ' + s.band, money(s.base)]);
      r.lines.push([dogsLabel(q.dogs), extra ? '+' + money(extra * DOG_ADD) : 'incl.']);
      r.lines.push([f.label + ' rate', f.mult === 1 ? 'base rate' : '×[' + f.mult + '] [CONFIRM]']);
      if (q.size === 'acreage') r.lines.push(['Per additional [1/4] acre [CONFIRM]', '+$[XX]']);
      if (q.first) r.lines.push(['[FIRST CLEANUP FEE] · first visit only', '+' + money(FIRST_FEE)]);
      r.total = pv; r.per = '/ visit'; r.month = money(pv * f.visits) + ' / month';
      r.visits = '[' + f.visits + '] visits';
    }
    return r;
  }

  /* ---------------- availability (demo data) ---------------- */
  function startOfDay(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  var TODAY = startOfDay(new Date());
  function dayStatus(d) {
    var diff = Math.round((d - TODAY) / 864e5);
    if (diff < 2) return 'past';
    var wd = d.getDay();
    if (wd === 0 || wd === 6) return 'closed';
    if ((d.getDate() * 7 + d.getMonth()) % 5 === 0) return 'full';
    return 'open';
  }
  function nextOpen() {
    var d = new Date(TODAY);
    for (var i = 0; i < 60; i++) { d.setDate(d.getDate() + 1); if (dayStatus(d) === 'open') return new Date(d); }
    return null;
  }
  function fmtDate(d, long) {
    return d.toLocaleDateString('en-US', long ? { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' } : { weekday: 'short', month: 'short', day: 'numeric' });
  }

  /* ---------------- odometer: each digit rolls, 30ms stagger right-to-left ---------------- */
  function setOdo(el, text) {
    if (!el) return;
    var chars = text.split('');
    var sig = chars.map(function (c) { return /\d/.test(c) ? 'd' : c; }).join('');
    if (el.getAttribute('data-sig') !== sig) {
      el.innerHTML = '';
      var digitCount = chars.filter(function (c) { return /\d/.test(c); }).length, di = 0;
      chars.forEach(function (c) {
        if (/\d/.test(c)) {
          var d = document.createElement('span'); d.className = 'odo__d';
          var col = document.createElement('span'); col.className = 'odo__col';
          col.style.setProperty('--i', String(digitCount - 1 - di)); di++;
          for (var n = 0; n < 10; n++) { var s = document.createElement('span'); s.textContent = n; col.appendChild(s); }
          col.style.transition = 'none';
          col.style.transform = 'translateY(' + (-1.08 * (+c)) + 'em)';
          d.appendChild(col); el.appendChild(d);
          // re-enable transition after first paint
          requestAnimationFrame(function () { requestAnimationFrame(function () { col.style.transition = ''; }); });
        } else {
          var st = document.createElement('span'); st.className = 'odo__static'; st.textContent = c; el.appendChild(st);
        }
      });
      el.setAttribute('data-sig', sig);
      return;
    }
    var cols = $$('.odo__col', el), k = 0;
    chars.forEach(function (c) {
      if (/\d/.test(c)) { cols[k].style.transform = 'translateY(' + (-1.08 * (+c)) + 'em)'; k++; }
    });
  }

  /* ---------------- render all controls + receipts from state ---------------- */
  var live = null;
  function render() {
    store.set('scoop_quote', q);
    var r = calc();
    // controls
    $$('[data-ctl="size"] button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === q.size)); });
    $$('[data-ctl="freq"] button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === q.freq)); });
    $$('[data-ctl="dogs"]').forEach(function (st) {
      var out = $('output', st);
      if (out) out.textContent = q.dogs >= MAX_DOGS ? '[7+] — CONFIRM' : String(q.dogs) + (q.dogs === 1 ? ' dog' : ' dogs');
      $('[data-step="-1"]', st).disabled = q.dogs <= 1;
      $('[data-step="1"]', st).disabled = q.dogs >= MAX_DOGS;
    });
    $$('[data-ctl="first"]').forEach(function (c) { c.checked = !!q.first; c.disabled = r.oneoff; });
    $$('[data-first-wrap]').forEach(function (w) { w.hidden = r.oneoff; });
    $$('[data-dogs-note]').forEach(function (n) { n.hidden = q.dogs < MAX_DOGS; });
    // receipts
    $$('[data-receipt]').forEach(function (rc) {
      var ul = $('[data-r="lines"]', rc);
      if (ul) ul.innerHTML = r.lines.map(function (l) { return '<li><span>' + l[0] + '</span><span>' + l[1] + '</span></li>'; }).join('');
      setOdo($('[data-r="total"]', rc), money(r.total));
      var srt = $('[data-r="sr"]', rc); if (srt) srt.textContent = (r.oneoff ? 'One-time total ' : 'Per visit ') + money(r.total) + ' (demo figure)';
      var per = $('[data-r="per"]', rc); if (per) per.textContent = r.per;
      var lbl = $('[data-r="lbl"]', rc); if (lbl) lbl.textContent = r.oneoff ? 'One-time total' : 'Per visit';
      var mo = $('[data-r="month"]', rc);
      if (mo) { mo.hidden = !r.month; if (r.month) mo.innerHTML = '<span>' + r.visits + ' / month [CONFIRM]</span><span>' + r.month + '</span>'; }
      var terms = $('[data-r="terms"]', rc);
      if (terms) terms.innerHTML = r.oneoff
        ? 'Books a single date, not a plan. Card charged <span class="ph">[WHEN — CONFIRM]</span>.'
        : 'Billed <span class="ph">[BILLING CADENCE — CONFIRM]</span> · Pause or cancel anytime <span class="ph">[CONFIRM]</span> · Skip a week from the account page <span class="ph">[CONFIRM]</span>';
      var nx = $('[data-r="next"]', rc); var no = nextOpen();
      if (nx && no) nx.textContent = fmtDate(no);
      var go = $('[data-r="go"]', rc); if (go) go.textContent = r.oneoff ? 'Book this cleanup' : 'Start service';
    });
    // live-figure hooks (sticky bar, CTA band, mini bar)
    var fig = money(r.total) + (r.oneoff ? ' one-time' : '/visit');
    $$('[data-live="fig"]').forEach(function (e) { e.textContent = fig; });
    $$('[data-live="verb"]').forEach(function (e) { e.textContent = r.oneoff ? 'Book cleanup' : 'Start service'; });
    $$('[data-live="mini"]').forEach(function (e) { e.innerHTML = r.lines.map(function (l) { return '<li><span>' + l[0] + '</span><span>' + l[1] + '</span></li>'; }).join('') + (r.month ? '<li><span>Monthly [CONFIRM]</span><span>' + r.month + '</span></li>' : ''); });
    if (live) live.textContent = 'Price updated: ' + fig.replace('$[', '$').replace(']', '') + ' (demo figure)';
    document.dispatchEvent(new CustomEvent('quote:change'));
  }

  $$('[data-builder]').forEach(function (b) {
    $$('[data-ctl="size"] button', b).forEach(function (btn) {
      btn.addEventListener('click', function () { q.size = btn.getAttribute('data-v'); render(); });
    });
    $$('[data-ctl="freq"] button', b).forEach(function (btn) {
      btn.addEventListener('click', function () { q.freq = btn.getAttribute('data-v'); render(); });
    });
    $$('[data-ctl="dogs"] button', b).forEach(function (btn) {
      btn.addEventListener('click', function () {
        q.dogs = Math.max(1, Math.min(MAX_DOGS, q.dogs + parseInt(btn.getAttribute('data-step'), 10))); render();
      });
    });
    $$('[data-ctl="first"]', b).forEach(function (c) { c.addEventListener('change', function () { q.first = c.checked; render(); }); });
  });
  // preset links (plan-card "Start" buttons set the frequency first)
  $$('[data-set-freq]').forEach(function (a) {
    a.addEventListener('click', function () { q.freq = a.getAttribute('data-set-freq'); store.set('scoop_quote', q); });
  });
  live = $('#quote-live');
  if ($('[data-receipt]') || $('[data-live]')) render();

  /* ---------------- mobile mini receipt (above the Start bar) ---------------- */
  var quoteSec = $('#quote'), rwrap = $('.receipt-wrap'), mini = $('.mini');
  if (quoteSec && rwrap && mini && 'IntersectionObserver' in window) {
    var inQuote = false, receiptSeen = false;
    var upd = function () { document.body.classList.toggle('has-mini', inQuote && !receiptSeen && window.innerWidth < 900); };
    new IntersectionObserver(function (en) { inQuote = en[0].isIntersecting; upd(); }, { threshold: 0 }).observe(quoteSec);
    new IntersectionObserver(function (en) { receiptSeen = en[0].isIntersecting; upd(); }, { threshold: 0.35 }).observe(rwrap);
    window.addEventListener('resize', upd);
    var tg = $('.mini__toggle', mini), pn = $('.mini__panel', mini);
    if (tg && pn) tg.addEventListener('click', function () {
      var open = tg.getAttribute('aria-expanded') === 'true';
      tg.setAttribute('aria-expanded', String(!open)); pn.hidden = open; tg.textContent = open ? 'Details' : 'Hide';
    });
  }

  /* ================================================================
     ZIP GATE — front-end only. Placeholder list: ['[ZIP]','[ZIP]','[ZIP]','[ZIP]']
     DEMO RULE (visible on the page): ZIPs ending in an even digit are
     "in route"; odd shows the out-of-route waitlist state.
     ================================================================ */
  var SERVICE_ZIPS = ['[ZIP]', '[ZIP]', '[ZIP]', '[ZIP]']; // [SERVICE AREA ZIPS — CONFIRM]
  function inRoute(zip) { return SERVICE_ZIPS.indexOf(zip) > -1 || (+zip.slice(-1)) % 2 === 0; }
  function setHeaderChip(zip) {
    $$('.zip-chip').forEach(function (c) {
      if (zip) { c.classList.add('is-set'); $('span', c).textContent = 'ZIP ' + zip + ' · [DAY] route'; }
      else c.classList.remove('is-set');
    });
  }
  function gateState(g, state, zip) {
    var form = $('form', g), ok = $('.zip-ok', g), out = $('.zip-out', g), err = $('.zipgate__err', g);
    if (err) err.hidden = true;
    form.hidden = state !== 'ask';
    ok.hidden = state !== 'ok';
    out.hidden = state !== 'out';
    if (state === 'ok') {
      $('.zip-ok__txt', ok).textContent = 'Serving ' + zip + ' · [DAY] route';
    }
    if (state === 'out') {
      $('.zip-out__zip', out).textContent = zip;
      var wz = $('input[name="wl-zip"]', out); if (wz) wz.value = zip;
    }
  }
  $$('.zipgate').forEach(function (g) {
    var form = $('form', g), input = $('input', form), err = $('.zipgate__err', g);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = (input.value || '').replace(/\D/g, '');
      if (v.length !== 5) { err.hidden = false; input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
      input.removeAttribute('aria-invalid');
      if (inRoute(v)) {
        store.set('scoop_zip', { zip: v });
        $$('.zipgate').forEach(function (other) { gateState(other, 'ok', v); });
        setHeaderChip(v);
        $$('[data-zip-fill]').forEach(function (f) { f.value = v; });
        var target = $('#quote');
        var okLink = $('.zip-ok', g);
        if (target) {
          scrollToEl(target);
          var h = $('#quote-h'); if (h) setTimeout(function () { h.focus({ preventScroll: true }); }, reduced() ? 0 : 450);
        } else if (okLink) { var a = $('a', okLink); if (a) a.focus(); }
      } else {
        gateState(g, 'out', v);
        var em = $('input[type="email"]', g); if (em) em.focus();
      }
    });
    $$('[data-zip-reset]', g).forEach(function (b) {
      b.addEventListener('click', function () {
        store.del('scoop_zip'); setHeaderChip(null);
        $$('.zipgate').forEach(function (other) { gateState(other, 'ask'); });
        input.value = ''; input.focus();
      });
    });
  });
  var saved = store.get('scoop_zip');
  if (saved && saved.zip) {
    setHeaderChip(saved.zip);
    $$('.zipgate').forEach(function (g) { gateState(g, 'ok', saved.zip); });
    $$('[data-zip-fill]').forEach(function (f) { if (!f.value) f.value = saved.zip; });
  }

  /* ---------------- demo forms (client-side only) ---------------- */
  function validate(scope) {
    var ok = true, first = null;
    $$('input, select, textarea', scope).forEach(function (el) {
      if (el.type === 'hidden' && !el.hasAttribute('data-required')) return;
      var need = el.hasAttribute('required') || el.hasAttribute('data-required');
      var field = el.closest('.field') || el.closest('.radios');
      var bad = false, v = (el.value || '').trim();
      if (el.type === 'radio') {
        if (!need) return;
        var group = $$('input[name="' + el.name + '"]', scope);
        bad = !group.some(function (r) { return r.checked; });
      } else if (need && !v) bad = true;
      else if (v && el.type === 'email') bad = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      else if (v && el.hasAttribute('data-zip')) bad = !/^\d{5}$/.test(v);
      else if (v && el.type === 'tel') bad = v.replace(/\D/g, '').length < 10;
      if (field) field.classList.toggle('is-bad', bad);
      if (bad) { el.setAttribute('aria-invalid', 'true'); ok = false; if (!first) first = el; }
      else el.removeAttribute('aria-invalid');
    });
    if (first) first.focus();
    return ok;
  }
  $$('form[data-demo]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(f)) return;
      var done = document.getElementById(f.getAttribute('data-demo'));
      if (done) { done.classList.add('is-on'); done.setAttribute('tabindex', '-1'); done.focus(); }
      f.hidden = true;
    });
  });

  /* ---------------- pricing: mobile size-band selector ---------------- */
  var mm = $('.matrix-mob');
  if (mm) {
    $$('[data-band] button', mm).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('[data-band] button', mm).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        var s = SIZES[b.getAttribute('data-v')];
        $$('[data-band-title]', mm).forEach(function (t) { t.textContent = s.label + ' · ' + s.band; });
      });
    });
  }

  /* ================================================================
     SIGNUP FLOW — 4 steps, no human step, no phone route.
     ================================================================ */
  var flow = $('#flow');
  if (flow) {
    var steps = $$('.panel[data-step]', flow), cur = 1;
    var bars = $$('.progress li');
    var selDate = null;
    function show(n, quiet) {
      cur = n;
      steps.forEach(function (p) { p.hidden = String(p.getAttribute('data-step')) !== String(n); });
      bars.forEach(function (li, i) {
        li.classList.toggle('is-done', i + 1 < n || n === 'done');
        li.classList.toggle('is-now', i + 1 === n);
        if (i + 1 === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
      });
      var panel = steps.filter(function (p) { return !p.hidden; })[0];
      var h = panel && $('h2', panel);
      if (quiet) { syncSummary(); return; }
      scrollToEl($('#flow-top'));
      if (h) { h.setAttribute('tabindex', '-1'); setTimeout(function () { h.focus({ preventScroll: true }); }, reduced() ? 0 : 300); }
      syncSummary();
    }
    function syncSummary() {
      var addr = [$('#su-street').value, $('#su-city').value].filter(Boolean).join(', ');
      $$('[data-sum="zip"]').forEach(function (e) { e.textContent = $('#su-zip').value || '[ZIP]'; });
      $$('[data-sum="addr"]').forEach(function (e) { e.textContent = addr || '[ADDRESS]'; });
      $$('[data-sum="date"]').forEach(function (e) { e.textContent = selDate ? fmtDate(selDate) : 'not chosen yet'; });
      var r = calc();
      $$('[data-sum="fig"]').forEach(function (e) { e.textContent = money(r.total) + (r.oneoff ? ' one-time' : ' / visit'); });
    }
    document.addEventListener('quote:change', function () { if (flow) syncSummary(); });
    ['#su-street', '#su-city', '#su-zip'].forEach(function (s) { var el = $(s); if (el) el.addEventListener('input', syncSummary); });

    $$('[data-next]', flow).forEach(function (b) {
      b.addEventListener('click', function () {
        var panel = b.closest('.panel');
        if (!validate(panel)) return;
        if (cur === 1) {
          var z = $('#su-zip'), zf = z.closest('.field');
          if (!inRoute(z.value)) {
            zf.classList.add('is-bad'); $('.err', zf).innerHTML = 'That ZIP is outside our current route. <a href="service-area.html#waitlist">Join the waitlist</a> — [WAITLIST POLICY — CONFIRM].';
            z.setAttribute('aria-invalid', 'true'); z.focus(); return;
          }
          store.set('scoop_zip', { zip: z.value }); setHeaderChip(z.value);
        }
        show(cur + 1);
      });
    });
    $$('[data-back]', flow).forEach(function (b) { b.addEventListener('click', function () { show(cur - 1); }); });
    var mt = $('.flow-mini > button');
    if (mt) mt.addEventListener('click', function () {
      var open = mt.getAttribute('aria-expanded') === 'true'; mt.setAttribute('aria-expanded', String(!open));
      $('.flow-mini__body').hidden = open;
    });

    /* calendar */
    var cal = $('#cal'), grid = $('#cal-grid'), title = $('#cal-title'), dateInput = $('#su-date'), calMsg = $('#cal-msg');
    var view = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
    var maxView = new Date(TODAY.getFullYear(), TODAY.getMonth() + 2, 1);
    var focusDate = nextOpen() || new Date(TODAY);
    var STATUS_TXT = { past: 'unavailable', closed: 'unavailable — no route', full: 'unavailable — route full', open: 'available' };
    function sameDay(a, b) { return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
    function drawCal(focusIt) {
      title.textContent = view.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      $('#cal-prev').disabled = view <= new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
      $('#cal-next').disabled = view >= maxView;
      var first = new Date(view), lead = first.getDay(), days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
      if (focusDate.getMonth() !== view.getMonth() || focusDate.getFullYear() !== view.getFullYear()) focusDate = new Date(view);
      var html = '', d = 1;
      for (var row = 0; row < 6 && d <= days; row++) {
        html += '<tr>';
        for (var c = 0; c < 7; c++) {
          if ((row === 0 && c < lead) || d > days) { html += '<td></td>'; continue; }
          var dt = new Date(view.getFullYear(), view.getMonth(), d), st = dayStatus(dt);
          var sel = sameDay(dt, selDate), foc = sameDay(dt, focusDate);
          html += '<td><button type="button" class="day" data-d="' + d + '" tabindex="' + (foc ? 0 : -1) + '"' +
            (st !== 'open' ? ' aria-disabled="true"' : '') + ' aria-pressed="' + sel + '" aria-label="' +
            fmtDate(dt, true) + ', ' + STATUS_TXT[st] + (sel ? ', selected' : '') + '">' + d + '</button></td>';
          d++;
        }
        html += '</tr>';
      }
      grid.innerHTML = html;
      if (focusIt) { var f = $('button[tabindex="0"]', grid); if (f) f.focus(); }
    }
    function moveFocus(delta) {
      var n = new Date(focusDate); n.setDate(n.getDate() + delta);
      var minV = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1), lastDay = new Date(maxView.getFullYear(), maxView.getMonth() + 1, 0);
      if (n < minV || n > lastDay) return;
      focusDate = n;
      if (n.getMonth() !== view.getMonth() || n.getFullYear() !== view.getFullYear()) view = new Date(n.getFullYear(), n.getMonth(), 1);
      drawCal(true);
    }
    if (cal) {
      grid.addEventListener('click', function (e) {
        var b = e.target.closest('button.day'); if (!b) return;
        var dt = new Date(view.getFullYear(), view.getMonth(), +b.getAttribute('data-d'));
        focusDate = dt;
        if (b.getAttribute('aria-disabled') === 'true') { calMsg.textContent = fmtDate(dt) + ' is not available. Choose a day without the hatch pattern.'; drawCal(true); return; }
        selDate = dt; dateInput.value = dt.toISOString().slice(0, 10);
        var fld = dateInput.closest('.field'); if (fld) fld.classList.remove('is-bad');
        calMsg.textContent = 'Start date selected: ' + fmtDate(dt, true) + '.';
        drawCal(true); syncSummary();
      });
      grid.addEventListener('keydown', function (e) {
        var map = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
        if (map[e.key]) { e.preventDefault(); moveFocus(map[e.key]); }
        else if (e.key === 'Home') { e.preventDefault(); moveFocus(-focusDate.getDay()); }
        else if (e.key === 'End') { e.preventDefault(); moveFocus(6 - focusDate.getDay()); }
        else if (e.key === 'PageDown') { e.preventDefault(); moveFocus(new Date(focusDate.getFullYear(), focusDate.getMonth() + 1, 0).getDate() - focusDate.getDate() + 1); }
        else if (e.key === 'PageUp') { e.preventDefault(); moveFocus(-focusDate.getDate()); }
      });
      $('#cal-prev').addEventListener('click', function () { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); drawCal(false); });
      $('#cal-next').addEventListener('click', function () { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); drawCal(false); });
      if (focusDate.getMonth() !== view.getMonth()) view = new Date(focusDate.getFullYear(), focusDate.getMonth(), 1);
      drawCal(false);
    }

    $('#su-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var panel = $('.panel[data-step="4"]');
      if (!validate(panel)) {
        var firstBad = $('[aria-invalid="true"]', panel);
        if (firstBad === dateInput) { var fb = $('button[tabindex="0"]', grid); if (fb) fb.focus(); }
        return;
      }
      var r = calc();
      $('#done-date').textContent = fmtDate(selDate, true);
      $('#done-plan').textContent = FREQ[q.freq].label + ' · ' + SIZES[q.size].label + ' · ' + dogsLabel(q.dogs);
      $('#done-fig').textContent = money(r.total) + (r.oneoff ? ' one-time' : ' / visit');
      $('#done-addr').textContent = [$('#su-street').value, $('#su-city').value, $('#su-zip').value].join(', ');
      $('#done-kind').textContent = r.oneoff ? 'Cleanup booked' : 'Service started';
      $('#done-first').textContent = r.oneoff ? 'Cleanup date' : 'First service';
      show('done');
      bars.forEach(function (li) { li.classList.add('is-done'); li.classList.remove('is-now'); });
    });

    var zf = $('#su-zip'); var sz = store.get('scoop_zip'); if (zf && sz && sz.zip && !zf.value) zf.value = sz.zip;
    show(1, true);
  }
})();
