/* ==========================================================================
   Allen & Key Assembly Co. — DEMO TEMPLATE (fictional business)
   Cart, filters, booking flow. Plain JS, no dependencies.
   Every price below is a PLACEHOLDER integer rendered inside $[ ] brackets.
   The maths sums the placeholder integers so the demo interaction works.
   ========================================================================== */
(function () {
  'use strict';

  /* ---- [PRICES — CONFIRM] catalogue (generated from the same source as the HTML) ---- */
  var CATALOG = {"bed-queen":{"n":"Bed frame, up to queen","p":89,"c":"beds","img":31086264},"tv-55":{"n":"TV mount, up to 55\"","p":99,"c":"tv","img":39338464},"wardrobe-2":{"n":"Wardrobe, 2-door","p":119,"c":"storage","img":2708106},"desk-writing":{"n":"Writing desk","p":69,"c":"desks","img":8004074},"sofa":{"n":"Sofa, 2–3 seat","p":99,"c":"seating","img":12277021},"dresser":{"n":"Dresser / chest of drawers","p":99,"c":"beds","img":8288959},"tv-75":{"n":"TV mount, 56–75\"","p":149,"c":"tv","img":7546718},"shelving":{"n":"Open shelving unit","p":55,"c":"storage","img":7578290},"chair-task":{"n":"Office chair","p":45,"c":"desks","img":5824550},"dining-table":{"n":"Dining table","p":79,"c":"seating","img":2995012},"patio":{"n":"Patio dining set","p":119,"c":"outdoor","img":11939817},"nightstand":{"n":"Nightstand","p":45,"c":"beds","img":12277220},"mirror":{"n":"Mirror or wall art, hung","p":39,"c":"tv","img":15269290},"bookcase":{"n":"Bookcase wall system","p":159,"c":"storage","img":7587290},"desk-drawers":{"n":"Desk with drawer pedestal","p":99,"c":"desks","img":6817179},"armchair":{"n":"Armchair","p":49,"c":"seating","img":6615806},"curtain":{"n":"Curtain rod or track","p":49,"c":"tv","img":15226283},"sideboard":{"n":"Sideboard / cabinet","p":79,"c":"storage","img":11112749},"coffee":{"n":"Coffee table","p":45,"c":"seating","img":30440152},"bed-king":{"n":"Storage bed, king","p":139,"c":"beds","img":7546649},"wardrobe-4":{"n":"Wardrobe, 3–4 door","p":189,"c":"storage","img":6301178},"desk-compact":{"n":"Compact desk","p":55,"c":"desks","img":19955715},"chair-desk":{"n":"Desk chair","p":39,"c":"desks","img":7045861},"dining-chairs":{"n":"Dining chairs, set of 4","p":69,"c":"seating","img":7180275},"barstools":{"n":"Bar stools, pair","p":45,"c":"seating","img":10557274},"media":{"n":"Media console","p":69,"c":"tv","img":5755711},"shelf-float":{"n":"Floating shelf","p":39,"c":"tv","img":35266315},"pictures":{"n":"Picture set, hung","p":59,"c":"tv","img":8521987},"adirondack":{"n":"Outdoor chairs, pair","p":59,"c":"outdoor","img":16542778},"bistro":{"n":"Bistro set","p":55,"c":"outdoor","img":3063047},"console":{"n":"Console / hall table","p":49,"c":"storage","img":8135288},"bundle-single":{"n":"Bundle: Single item","p":45,"c":"bundle","img":null},"bundle-room":{"n":"Bundle: Room","p":199,"c":"bundle","img":null},"bundle-move":{"n":"Bundle: Whole move-in","p":449,"c":"bundle","img":null}};

  var doc = document;
  var root = doc.documentElement;
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function reduced() { return !!(mq && mq.matches); }
  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }

  /* ---------- Price formatting (placeholder treatment) ---------- */
  function num(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function priceHTML(n) {
    return '$<span class="b">[</span><span class="n">' + num(n) + '</span><span class="b">]</span>';
  }
  function priceText(n) { return '$[' + num(n) + ']'; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------- Storage (guarded) ---------- */
  var KEY = 'ak-demo-cart-v1';
  function load() {
    try {
      var raw = JSON.parse(window.localStorage.getItem(KEY) || '{}');
      var out = {};
      Object.keys(raw || {}).forEach(function (id) {
        var q = parseInt(raw[id], 10);
        if (CATALOG[id] && q > 0) out[id] = Math.min(q, 20);
      });
      return out;
    } catch (e) { return {}; }
  }
  function save() { try { window.localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) { /* storage blocked: cart still works for this page view */ } }

  var cart = load();

  function count() { return Object.keys(cart).reduce(function (a, id) { return a + cart[id]; }, 0); }
  function total() { return Object.keys(cart).reduce(function (a, id) { return a + cart[id] * CATALOG[id].p; }, 0); }

  /* ---------- Live region ---------- */
  var live = $('[data-live]');
  function announce(msg) { if (!live) return; live.textContent = ''; setTimeout(function () { live.textContent = msg; }, 30); }

  /* ---------- Count-up for totals (320ms) ---------- */
  function setNumber(el, to) {
    var nEl = el.querySelector('.n');
    if (!nEl) { el.innerHTML = priceHTML(to); return; }
    var from = parseFloat(el.getAttribute('data-val') || '0') || 0;
    el.setAttribute('data-val', String(to));
    if (el._raf) cancelAnimationFrame(el._raf);
    if (reduced() || from === to) { nEl.textContent = num(to); return; }
    var start = null, dur = 320;
    function tick(t) {
      if (start === null) start = t;
      var k = Math.min(1, (t - start) / dur);
      var e = 1 - Math.pow(1 - k, 3);
      nEl.textContent = num(from + (to - from) * e);
      if (k < 1) el._raf = requestAnimationFrame(tick); else nEl.textContent = num(to);
    }
    el._raf = requestAnimationFrame(tick);
  }
  function setCountText(el, to) {
    var from = parseInt(el.getAttribute('data-val') || '0', 10) || 0;
    el.setAttribute('data-val', String(to));
    if (reduced() || from === to) { el.textContent = String(to); return; }
    var start = null, dur = 320;
    function tick(t) {
      if (start === null) start = t;
      var k = Math.min(1, (t - start) / dur);
      el.textContent = String(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- Cart mutations ---------- */
  function setQty(id, q, opts) {
    opts = opts || {};
    if (!CATALOG[id]) return;
    var before = cart[id] || 0;
    q = Math.max(0, Math.min(20, q));
    if (q === before) return;
    if (q === 0) delete cart[id]; else cart[id] = q;
    save();
    render({ changed: id, up: q > before });
    var it = CATALOG[id];
    var n = count();
    announce((q > before ? 'Added ' : 'Removed ') + it.n + '. ' + n + (n === 1 ? ' item' : ' items') + ', total ' + priceText(total()) + ' (demo figure).');
  }
  function inc(id) { setQty(id, (cart[id] || 0) + 1); }
  function dec(id) { setQty(id, (cart[id] || 0) - 1); }

  /* ---------- Rendering ---------- */
  var firstRender = true;
  function render(info) {
    info = info || {};
    var n = count(), t = total();

    // Cards / steppers
    $$('[data-id]').forEach(function (card) {
      var id = card.getAttribute('data-id');
      var q = cart[id] || 0;
      card.classList.toggle('in-cart', q > 0);
      var out = card.querySelector('[data-qty]');
      if (out && out.textContent !== String(q)) {
        if (!reduced() && !firstRender && info.changed === id) {
          out.classList.add('fade');
          setTimeout(function () { out.textContent = String(q); out.classList.remove('fade'); }, 140);
        } else { out.textContent = String(q); }
      }
      var decb = card.querySelector('[data-dec]');
      if (decb) decb.disabled = q === 0;
      if (info.changed === id && info.up && !reduced()) {
        card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash');
        setTimeout(function () { card.classList.remove('flash'); }, 400);
      }
    });

    // Badges
    $$('[data-cart-count]').forEach(function (b) {
      b.textContent = String(n);
      b.classList.toggle('is-empty', n === 0);
      if (!firstRender && info.changed && !reduced()) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
    });
    $$('[data-cart-label]').forEach(function (el) { el.setAttribute('aria-label', 'Your booking: ' + n + (n === 1 ? ' item' : ' items') + ', total ' + priceText(t) + ' (demo)'); });

    // Totals
    $$('[data-cart-total]').forEach(function (el) { if (firstRender) { el.setAttribute('data-val', String(t)); el.innerHTML = priceHTML(t); } else setNumber(el, t); });
    $$('[data-cart-items]').forEach(function (el) { if (firstRender) { el.setAttribute('data-val', String(n)); el.textContent = String(n); } else setCountText(el, n); });
    $$('[data-cart-plural]').forEach(function (el) { el.textContent = n === 1 ? 'item' : 'items'; });

    // Running total bars
    $$('[data-cartbar]').forEach(function (bar) { bar.classList.toggle('is-hidden', n === 0); bar.setAttribute('aria-hidden', n === 0 ? 'true' : 'false'); $$('a,button', bar).forEach(function (x) { x.tabIndex = n === 0 ? -1 : 0; }); });

    // Mobile sticky bar
    $$('[data-mbar]').forEach(function (a) {
      var e = a.querySelector('[data-mbar-empty]'), f = a.querySelector('[data-mbar-full]');
      if (e) e.hidden = n > 0;
      if (f) f.hidden = n === 0;
    });

    renderLines();
    renderSummary();
    if (bookApi) bookApi.cartChanged();
    firstRender = false;
  }

  function thumb(it) {
    if (!it.img) return '<span class="line__img" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8l9-5 9 5v8l-9 5-9-5V8z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg></span>';
    return '<span class="line__img"><img src="https://images.pexels.com/photos/' + it.img + '/pexels-photo-' + it.img + '.jpeg?auto=compress&cs=tinysrgb&w=160" alt="" width="56" height="56" loading="lazy"></span>';
  }

  function renderLines() {
    $$('[data-lines]').forEach(function (ul) {
      var ids = Object.keys(cart);
      var empty = ul.parentNode.querySelector('[data-lines-empty]');
      if (empty) empty.hidden = ids.length > 0;
      ul.innerHTML = ids.map(function (id) {
        var it = CATALOG[id], q = cart[id];
        return '<li class="line" data-line="' + id + '">' + thumb(it) +
          '<div><div class="line__name">' + esc(it.n) + '</div><div class="line__meta">' + priceText(it.p) + ' each</div></div>' +
          '<div class="stepper" role="group" aria-label="Quantity: ' + esc(it.n) + '">' +
          '<button type="button" data-ldec="' + id + '" aria-label="Remove one ' + esc(it.n) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/></svg></button>' +
          '<output>' + q + '</output>' +
          '<button type="button" data-linc="' + id + '" aria-label="Add one ' + esc(it.n) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></button></div>' +
          '<div class="line__sub"><button type="button" class="rm" data-lrm="' + id + '">Remove</button><span class="p">' + priceHTML(it.p * q) + '</span></div></li>';
      }).join('');
    });
  }

  function renderSummary() {
    $$('[data-slines]').forEach(function (ul) {
      var ids = Object.keys(cart);
      ul.innerHTML = ids.length ? ids.map(function (id) {
        var it = CATALOG[id];
        return '<li><span>' + esc(it.n) + ' <span class="q">× ' + cart[id] + '</span></span><span class="p">' + priceHTML(it.p * cart[id]) + '</span></li>';
      }).join('') : '<li><span class="q">No items yet — add from step 1.</span></li>';
    });
  }

  /* ---------- Delegated clicks ---------- */
  doc.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target : null;
    if (!t) return;
    var b;
    if ((b = t.closest('[data-inc]'))) { inc(b.closest('[data-id]').getAttribute('data-id')); return; }
    if ((b = t.closest('[data-dec]'))) { dec(b.closest('[data-id]').getAttribute('data-id')); return; }
    if ((b = t.closest('[data-add]'))) { inc(b.closest('[data-id]').getAttribute('data-id')); return; }
    if ((b = t.closest('[data-add-id]'))) { inc(b.getAttribute('data-add-id')); return; }
    if ((b = t.closest('[data-linc]'))) { inc(b.getAttribute('data-linc')); return; }
    if ((b = t.closest('[data-ldec]'))) { dec(b.getAttribute('data-ldec')); return; }
    if ((b = t.closest('[data-lrm]'))) { setQty(b.getAttribute('data-lrm'), 0); return; }
    if ((b = t.closest('[data-cart-open]'))) { e.preventDefault(); openDrawer(b); return; }
    if ((b = t.closest('[data-cart-close]'))) { closeDrawer(); return; }
    if ((b = t.closest('[data-goto-filter]'))) {
      e.preventDefault();
      var f = b.getAttribute('data-goto-filter');
      var scope = $('#items [data-builder]') || $('[data-builder]');
      if (scope) { setFilter(scope, f, true); }
      var target = $('#items');
      if (target) target.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
      var chip = scope && scope.querySelector('[data-filter="' + f + '"]');
      if (chip) setTimeout(function () { chip.focus({ preventScroll: true }); }, reduced() ? 0 : 450);
      return;
    }
  });

  /* ---------- Cart drawer ---------- */
  var drawer = $('[data-drawer]'), lastFocus = null;
  function openDrawer(from) {
    if (!drawer) { window.location.href = 'book.html'; return; }
    lastFocus = from || doc.activeElement;
    drawer.hidden = false;
    drawer.classList.add('is-open');
    requestAnimationFrame(function () { drawer.classList.add('is-shown'); });
    doc.body.style.overflow = 'hidden';
    var c = drawer.querySelector('[data-cart-close]'); if (c) c.focus();
  }
  function closeDrawer() {
    if (!drawer || drawer.hidden) return;
    drawer.classList.remove('is-shown');
    var done = function () { drawer.classList.remove('is-open'); drawer.hidden = true; doc.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); };
    if (reduced()) done(); else setTimeout(done, 240);
  }
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeDrawer(); closeMenu(); }
    if (e.key === 'Tab' && drawer && !drawer.hidden) {
      var f = $$('a[href],button:not([disabled]),input,select,textarea', drawer).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && doc.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && doc.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  /* ---------- Mobile menu ---------- */
  var menuBtn = $('[data-menu]'), mnav = $('#mnav');
  function closeMenu() { if (menuBtn && mnav && !mnav.hidden) { mnav.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); } }
  if (menuBtn && mnav) {
    menuBtn.addEventListener('click', function () {
      var open = mnav.hidden;
      mnav.hidden = !open;
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    $$('a', mnav).forEach(function (a) { a.addEventListener('click', closeMenu); });
  }

  /* ---------- Header condense (past 60px) ---------- */
  var hdr = $('[data-header]');
  var condensed = null;
  function onScroll() {
    var c = window.scrollY > 60;
    if (c !== condensed) {
      condensed = c;
      root.classList.toggle('is-condensed', c);
      if (hdr) hdr.classList.toggle('is-condensed', c);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Filters (fade only — no layout animation) ---------- */
  function setFilter(scope, f, animate) {
    $$('[data-filter]', scope).forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-filter') === f ? 'true' : 'false'); });
    scope.setAttribute('data-current', f);
    var items = $$('[data-item]', scope);
    var limit = parseInt(scope.getAttribute('data-limit') || '0', 10);
    var expanded = scope.getAttribute('data-expanded') === 'true';
    var shown = 0;
    var next = items.map(function (li) {
      var ok = f === 'all' || li.getAttribute('data-cat') === f;
      if (ok && f === 'all' && limit && !expanded) { ok = shown < limit; }
      if (ok) shown++;
      return ok;
    });
    var more = scope.querySelector('[data-more]');
    if (more) more.hidden = !(f === 'all' && limit && !expanded && items.length > limit);
    var status = scope.querySelector('[data-filter-status]');
    if (status) {
      var chipEl = scope.querySelector('[data-filter="' + f + '"]');
      var lbl = f === 'all' || !chipEl ? '' : ' in ' + chipEl.getAttribute('data-label');
      status.textContent = 'Showing ' + shown + ' ' + (shown === 1 ? 'item' : 'items') + lbl + '.';
    }

    function apply() {
      var k = 0;
      items.forEach(function (li, i) {
        var wasHidden = li.hidden;
        li.hidden = !next[i];
        li.classList.remove('is-out', 'is-in');
        if (animate && !reduced() && !li.hidden) {
          li.style.animationDelay = (Math.min(k, 12) * 40) + 'ms';
          li.classList.add('is-in');
          k++;
        }
        if (!li.hidden) { var r = li.querySelector('[data-reveal]'); if (r) r.classList.add('is-in'); if (li.hasAttribute('data-reveal')) li.classList.add('is-in'); }
        void wasHidden;
      });
    }
    if (animate && !reduced()) {
      items.forEach(function (li) { if (!li.hidden) li.classList.add('is-out'); });
      setTimeout(apply, 120);
    } else { apply(); }
  }
  $$('[data-builder]').forEach(function (scope) {
    $$('[data-filter]', scope).forEach(function (chip) {
      chip.addEventListener('click', function () { setFilter(scope, chip.getAttribute('data-filter'), true); });
    });
    var more = scope.querySelector('[data-more]');
    if (more) more.addEventListener('click', function () {
      scope.setAttribute('data-expanded', 'true');
      var before = $$('[data-item]', scope).filter(function (li) { return !li.hidden; }).length;
      setFilter(scope, scope.getAttribute('data-current') || 'all', false);
      var nextItem = $$('[data-item]', scope)[before];
      if (nextItem) { var btn = nextItem.querySelector('[data-inc]'); if (btn) btn.focus(); }
    });
    setFilter(scope, 'all', false);
  });

  /* ---------- Scroll reveal (stagger 50ms) ---------- */
  var reveals = $$('[data-reveal]');
  reveals.forEach(function (el) {
    var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.hasAttribute('data-reveal'); });
    var i = sibs.indexOf(el);
    el.style.setProperty('--d', (Math.min(i, 8) * 50) + 'ms');
  });
  if (!('IntersectionObserver' in window) || reduced()) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Count-up stats ---------- */
  $$('[data-count]').forEach(function (el) {
    var to = parseInt(el.getAttribute('data-count'), 10) || 0;
    if (reduced() || !('IntersectionObserver' in window)) { el.textContent = String(to); return; }
    el.textContent = '0';
    var o = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      o.disconnect();
      var s = null;
      requestAnimationFrame(function tick(t) {
        if (s === null) s = t;
        var k = Math.min(1, (t - s) / 900);
        el.textContent = String(Math.round(to * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(tick);
      });
    });
    o.observe(el);
  });

  /* ---------- ZIP check — demo dataset [SERVICE AREA ZIPS — CONFIRM] ---------- */
  var AREA_ZIPS = /^000\d\d$/; // demo: 00001–00099 are "in area"
  $$('[data-zip]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input');
      var res = form.parentNode.querySelector('[data-zip-result]');
      var v = (input.value || '').trim();
      var field = input.closest('.field');
      if (!/^\d{5}$/.test(v)) {
        if (field) field.classList.add('has-error');
        input.setAttribute('aria-invalid', 'true');
        res.className = 'zipres no';
        res.innerHTML = 'Enter a 5-digit ZIP code.';
        input.focus();
        return;
      }
      if (field) field.classList.remove('has-error');
      input.removeAttribute('aria-invalid');
      if (AREA_ZIPS.test(v) && v !== '00000') {
        res.className = 'zipres ok';
        res.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"/></svg><span>' + esc(v) + ' is in our area. <a class="tlink" href="book.html">Pick your items and a slot</a></span>';
      } else {
        res.className = 'zipres no';
        res.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></svg><span>' + esc(v) + ' is outside our regular area. A travel fee of <span class="ph">[+$[00] beyond [00] miles — CONFIRM]</span> may apply — the rest of the price list stays the same.</span>';
      }
    });
  });

  /* ---------- Simple demo forms (contact) ---------- */
  function validate(form) {
    var bad = [];
    $$('[required]', form).forEach(function (el) {
      var field = el.closest('.field') || el.closest('fieldset');
      var ok;
      if (el.type === 'radio') { ok = !!form.querySelector('input[name="' + el.name + '"]:checked'); }
      else if (el.type === 'email') { ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()); }
      else { ok = el.value.trim().length > 0; }
      if (field) field.classList.toggle('has-error', !ok);
      if (el.type !== 'radio') { if (!ok) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid'); }
      if (!ok && bad.indexOf(el) < 0) bad.push(el);
    });
    return bad;
  }
  $$('[data-demo-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = validate(form);
      if (bad.length) { bad[0].focus(); announce('Please complete the highlighted fields.'); return; }
      var ok = form.parentNode.querySelector('[data-sent]');
      form.hidden = true;
      if (ok) { ok.hidden = false; ok.focus(); }
    });
  });

  /* =====================================================================
     BOOKING FLOW (book.html) — 4 steps, history.pushState, no reloads
     ===================================================================== */
  var bookApi = null;
  var book = $('[data-book]');
  if (book) bookApi = initBook(book);

  function initBook(bookEl) {
    var steps = $$('[data-step]', bookEl);
    var railBtns = $$('[data-goto]', bookEl);
    var confirmEl = $('[data-confirmed]', bookEl);
    var state = { step: 1, day: null, win: null, formOk: false, done: false };

    /* [AVAILABILITY — CONFIRM] demo dataset: next 14 days × 3 windows.
       Deterministic pattern so the grid looks live; Sundays shown closed. */
    var WINDOWS = [
      { id: 'am', label: '8–11am', sub: 'Morning' },
      { id: 'mid', label: '12–3pm', sub: 'Afternoon' },
      { id: 'pm', label: '4–7pm', sub: 'Evening' }
    ];
    var DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var AVAILABILITY = [];
    for (var i = 0; i < 14; i++) {
      var d = new Date(today.getTime()); d.setDate(today.getDate() + i);
      var sunday = d.getDay() === 0;
      var wins = WINDOWS.map(function (w, wi) {
        var seed = (d.getDate() * 7 + wi * 5 + d.getMonth() * 3) % 6;
        var open = !sunday && seed !== 0 && seed !== 3;
        if (i === 0 && wi === 0) open = false; // this morning has passed
        return { id: w.id, label: w.label, sub: w.sub, open: open, sameDay: i === 0 };
      });
      AVAILABILITY.push({ iso: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'), date: d, idx: i, sunday: sunday, wins: wins });
    }
    function dayLabel(a) { return (a.idx === 0 ? 'Today, ' : a.idx === 1 ? 'Tomorrow, ' : DOW[a.date.getDay()] + ', ') + MON[a.date.getMonth()] + ' ' + a.date.getDate(); }

    var daysEl = $('[data-days]', bookEl), winsEl = $('[data-windows]', bookEl), winHead = $('[data-win-head]', bookEl);
    daysEl.innerHTML = AVAILABILITY.map(function (a) {
      var openN = a.wins.filter(function (w) { return w.open; }).length;
      return '<li><button type="button" class="day' + (openN ? '' : ' full') + '" data-day="' + a.iso + '" aria-pressed="false"' + (openN ? '' : ' disabled') + ' aria-label="' + dayLabel(a) + (openN ? ', ' + openN + ' windows open' : ', no windows') + '">' +
        '<span class="dow">' + (a.idx === 0 ? 'Today' : DOW[a.date.getDay()]) + '</span><span class="dn">' + a.date.getDate() + '</span><span class="mo">' + MON[a.date.getMonth()] + '</span>' +
        '<span class="av">' + (openN ? (a.idx === 0 ? 'Same-day' : openN + ' open') : (a.sunday ? 'Closed' : 'Full')) + '</span></button></li>';
    }).join('');

    function findDay(iso) { for (var k = 0; k < AVAILABILITY.length; k++) if (AVAILABILITY[k].iso === iso) return AVAILABILITY[k]; return null; }

    function renderWindows(animate) {
      var a = findDay(state.day);
      if (!a) { winsEl.innerHTML = ''; winHead.hidden = true; return; }
      winHead.hidden = false;
      winHead.querySelector('[data-day-name]').textContent = dayLabel(a);
      winsEl.innerHTML = a.wins.map(function (w, k) {
        var pressed = state.win === w.id;
        return '<button type="button" class="win' + (animate && !reduced() ? ' rev' : '') + '" style="animation-delay:' + (k * 60) + 'ms" data-win="' + w.id + '" aria-pressed="' + pressed + '"' + (w.open ? '' : ' disabled') + '>' +
          '<span><strong>' + w.label + '</strong><small>' + w.sub + (w.open ? '' : ' · unavailable') + '</small></span>' +
          (w.open && w.sameDay ? '<span class="sd">Same-day</span>' : '') + '</button>';
      }).join('');
    }

    daysEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-day]'); if (!b || b.disabled) return;
      if (state.day !== b.getAttribute('data-day')) state.win = null;
      state.day = b.getAttribute('data-day');
      $$('[data-day]', daysEl).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      renderWindows(true);
      updateAside(); msg(2, '');
    });
    winsEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-win]'); if (!b || b.disabled) return;
      state.win = b.getAttribute('data-win');
      $$('[data-win]', winsEl).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); x.classList.remove('rev'); });
      updateAside(); msg(2, '');
      var a = findDay(state.day);
      announce('Selected ' + dayLabel(a) + ', ' + winLabel() + '.');
    });

    function winLabel() { for (var k = 0; k < WINDOWS.length; k++) if (WINDOWS[k].id === state.win) return WINDOWS[k].label; return ''; }
    function slotText() { var a = findDay(state.day); return a && state.win ? dayLabel(a) + ', ' + winLabel() : ''; }

    var form = $('[data-where]', bookEl);
    function formVals() {
      var f = new FormData(form); var o = {};
      f.forEach(function (v, k) { o[k] = typeof v === 'string' ? v : (v && v.name ? v.name : ''); });
      return o;
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); next(); });
    form.addEventListener('input', function (e) {
      var fld = e.target.closest('.field, fieldset'); if (fld && fld.classList.contains('has-error')) validate(form);
      updateAside();
    });
    var fileIn = $('#b-photo', bookEl), fileOut = $('[data-file-name]', bookEl);
    if (fileIn && fileOut) fileIn.addEventListener('change', function () { fileOut.textContent = fileIn.files && fileIn.files[0] ? 'Attached: ' + fileIn.files[0].name + ' (stays in your browser — demo)' : 'No photo attached.'; });

    function msg(n, text) { var m = $('[data-msg="' + n + '"]', bookEl); if (m) m.textContent = text; }

    function maxAllowed() {
      if (count() === 0) return 1;
      if (!(state.day && state.win)) return 2;
      if (!state.formOk) return 3;
      return 4;
    }

    function updateAside() {
      var s = slotText();
      $$('[data-sum-slot]').forEach(function (el) { el.innerHTML = s ? '<span class="ph">[' + esc(s) + ']</span>' : '<span class="q">Not chosen yet</span>'; });
      var v = formVals();
      var addr = [v.address, v.unit].filter(Boolean).join(', ');
      $$('[data-sum-addr]').forEach(function (el) { el.innerHTML = addr ? esc(addr) : '<span class="q">Not entered yet</span>'; });
    }

    function renderReview() {
      var ids = Object.keys(cart);
      var rows = ids.map(function (id) { var it = CATALOG[id]; return '<tr><td>' + esc(it.n) + '</td><td>× ' + cart[id] + '</td><td><span class="p">' + priceHTML(it.p * cart[id]) + '</span></td></tr>'; }).join('');
      $('[data-review-items]', bookEl).innerHTML = rows;
      $('[data-review-total]', bookEl).innerHTML = priceHTML(total());
      $('[data-review-slot]', bookEl).innerHTML = '<span class="ph">[' + esc(slotText()) + ']</span>';
      var v = formVals();
      var yn = function (x) { return x ? esc(x) : '—'; };
      $('[data-review-where]', bookEl).innerHTML =
        '<p style="margin:0 0 6px"><strong>' + esc(v.address || '') + (v.unit ? ', ' + esc(v.unit) : '') + '</strong></p>' +
        '<p style="margin:0;color:var(--cocoa-60);font-size:15px">Elevator: ' + yn(v.elevator) + ' · Delivered: ' + yn(v.delivered) + (v.parking ? ' · Parking: ' + esc(v.parking) : '') + (v.access ? ' · Access: ' + esc(v.access) : '') + '</p>';
      $('[data-review-contact]', bookEl).innerHTML = '<p style="margin:0">' + esc(v.name || '') + '<br>' + esc(v.phone || '') + '<br>' + esc(v.email || '') + '</p>' + (v.notes ? '<p style="margin:8px 0 0;color:var(--cocoa-60);font-size:15px">Notes: ' + esc(v.notes) + '</p>' : '');
    }

    function show(n, dir, push) {
      n = Math.max(1, Math.min(4, n));
      var allowed = maxAllowed();
      if (n > allowed) n = allowed;
      if (state.done) return;
      var prev = state.step;
      state.step = n;
      steps.forEach(function (s) {
        var on = parseInt(s.getAttribute('data-step'), 10) === n;
        s.hidden = !on;
        s.classList.remove('enter', 'enter-back');
        if (on && !reduced() && prev !== n) { void s.offsetWidth; s.classList.add(dir < 0 ? 'enter-back' : 'enter'); }
      });
      railBtns.forEach(function (b) {
        var k = parseInt(b.getAttribute('data-goto'), 10);
        var li = b.parentNode;
        li.classList.toggle('cur', k === n);
        li.classList.toggle('done', k < n);
        b.disabled = k > maxAllowed();
        if (k === n) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
      if (n === 4) renderReview();
      if (push) { try { history.pushState({ akStep: n }, '', '#step-' + n); } catch (e) { /* file:// in some browsers */ } }
      var h = steps[n - 1].querySelector('h2');
      if (prev !== n && h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      if (prev !== n) {
        var top = bookEl.getBoundingClientRect().top + window.scrollY - (parseInt(getComputedStyle(root).getPropertyValue('--hdr-h'), 10) || 64) - 12;
        if (window.scrollY > top) window.scrollTo({ top: top, behavior: reduced() ? 'auto' : 'smooth' });
      }
    }

    function next() {
      var s = state.step;
      if (s === 1) {
        if (count() === 0) { msg(1, 'Add at least one item to continue.'); announce('Add at least one item to continue.'); return; }
        msg(1, ''); show(2, 1, true);
      } else if (s === 2) {
        if (!(state.day && state.win)) { msg(2, state.day ? 'Pick an arrival window.' : 'Pick a day, then an arrival window.'); announce($('[data-msg="2"]', bookEl).textContent); return; }
        show(3, 1, true);
      } else if (s === 3) {
        var bad = validate(form);
        state.formOk = bad.length === 0;
        if (!state.formOk) { msg(3, 'A few details are missing — they are highlighted above.'); bad[0].focus(); return; }
        msg(3, ''); show(4, 1, true);
      }
    }
    $$('[data-next]', bookEl).forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); next(); }); });
    $$('[data-back]', bookEl).forEach(function (b) { b.addEventListener('click', function () { if (state.step > 1) show(state.step - 1, -1, true); }); });
    railBtns.forEach(function (b) { b.addEventListener('click', function () { var k = parseInt(b.getAttribute('data-goto'), 10); if (k !== state.step) show(k, k < state.step ? -1 : 1, true); }); });
    $$('[data-edit]', bookEl).forEach(function (b) { b.addEventListener('click', function () { show(parseInt(b.getAttribute('data-edit'), 10), -1, true); }); });

    window.addEventListener('popstate', function (e) {
      var k = e.state && e.state.akStep ? e.state.akStep : parseStep();
      if (state.done) return;
      show(k, k < state.step ? -1 : 1, false);
    });
    function parseStep() { var m = /step-(\d)/.exec(window.location.hash); return m ? parseInt(m[1], 10) : 1; }

    var confirmBtn = $('[data-confirm-btn]', bookEl);
    confirmBtn.addEventListener('click', function () {
      if (maxAllowed() < 4) { show(maxAllowed(), -1, true); return; }
      var ref = 'AK-' + String(Math.floor(10000 + Math.random() * 89999));
      var slot = slotText();
      var tot = total(), n = count();
      $('[data-conf-ref]', bookEl).textContent = '[' + ref + ']';
      $('[data-conf-slot]', bookEl).textContent = '[' + slot + ']';
      $('[data-conf-total]', bookEl).innerHTML = priceHTML(tot);
      $('[data-conf-items]', bookEl).textContent = n + (n === 1 ? ' item' : ' items');
      state.done = true;
      steps.forEach(function (s) { s.hidden = true; });
      railBtns.forEach(function (b) { b.parentNode.classList.remove('cur'); b.parentNode.classList.add('done'); b.disabled = true; });
      confirmEl.hidden = false;
      if (!reduced()) { confirmEl.classList.add('enter'); }
      cart = {}; save(); render({});
      var h = confirmEl.querySelector('h2'); h.setAttribute('tabindex', '-1'); h.focus();
      try { history.replaceState({ akStep: 5 }, '', '#confirmed'); } catch (e) { /* ignore */ }
      announce('Demo booking ' + ref + ' confirmed for ' + slot + '.');
    });

    // Initial step from URL (clamped to what is actually possible)
    var initial = parseStep();
    try { history.replaceState({ akStep: Math.min(initial, maxAllowed()) }, '', '#step-' + Math.min(initial, maxAllowed())); } catch (e) { /* ignore */ }
    show(initial, 1, false);
    updateAside();

    return {
      cartChanged: function () {
        if (state.done) return;
        var n = count();
        var c = $('[data-step1-count]', bookEl);
        if (c) c.textContent = n ? n + (n === 1 ? ' item' : ' items') + ' in your booking.' : 'Nothing added yet.';
        if (n > 0) msg(1, '');
        railBtns.forEach(function (b) { b.disabled = parseInt(b.getAttribute('data-goto'), 10) > maxAllowed(); });
        if (state.step > 1 && n === 0) show(1, -1, true);
        if (state.step === 4) renderReview();
      }
    };
  }

  /* ---------- First paint ---------- */
  render({});
  window.__akReady = true;
})();
