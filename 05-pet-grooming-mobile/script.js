/* Fetchwagon Mobile Grooming — DEMO template 05 (ThinkFirst Studios)
   Plain JS, no dependencies. Every figure below is a PLACEHOLDER and renders bracketed.
   Nothing on this site sends or stores data. */
(function () {
  'use strict';

  var RM = window.matchMedia('(prefers-reduced-motion: reduce)');
  function reduced() { return RM.matches; }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ph(t, cls) { return '<span class="ph' + (cls ? ' ' + cls : '') + '">' + esc(t) + '</span>'; }
  function money(n) { return '$[' + n + ']'; }
  function phText(t) { return esc(t).replace(/\[[^\]]+\]/g, function (m) { return '<span class="ph ph--note">' + m + '</span>'; }); }

  /* ------------------------------------------------------------------
     Placeholder data — client replaces all of it.
     ------------------------------------------------------------------ */
  var ROUTE_ZIPS = ['[ZIP]', '[ZIP]', '[ZIP]']; // [SERVICE AREA ZIPS — CONFIRM]
  var BANDS = ['toy', 'small', 'medium', 'large', 'giant'];
  var BAND_NAME = { toy: 'Toy', small: 'Small', medium: 'Medium', large: 'Large', giant: 'Giant' };
  var COAT_NAME = { short: 'Short coat', double: 'Double coat', curly: 'Curly / non-shed' };
  var BASE = { tidy: [65, 75, 85, 100, 120], full: [95, 110, 125, 145, 170], works: [130, 145, 160, 185, 215] };
  var CAT_BASE = { tidy: 80, full: 115, works: 150 };
  var COAT_ADD = { short: 0, double: 10, curly: 15 };
  var PKG_NAME = { tidy: 'Tidy', full: 'Full Groom', works: 'The Works' };
  var PKG_DESC = { tidy: 'Bath, blow dry, nail trim, ear clean', full: 'Everything in Tidy + full haircut + sanitary trim', works: 'Everything in Full Groom + de-shed + teeth brushing [CONFIRM]' };
  var ADDONS = [
    { k: 'grind', n: 'Nail grind', p: 12 },
    { k: 'teeth', n: 'Teeth brushing [CONFIRM]', p: 10 },
    { k: 'brush', n: 'Extra brush-out, per [15] min', p: 15 },
    { k: 'pad', n: 'Pad trim', p: 8 },
    { k: 'bow', n: 'Bandana or bow', p: 5 }
  ];
  var SLOTS = ['[8:00 AM]', '[9:30 AM]', '[11:00 AM]', '[12:30 PM]', '[2:00 PM]', '[3:30 PM]'];
  var AREA_BY_DAY = [null, '[AREA A]', '[AREA B]', '[AREA C]', '[AREA A]', '[AREA B]', '[AREA C]'];
  var DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function priceFor(pet, pkg) {
    if (pet.species === 'cat') return CAT_BASE[pkg];
    var i = BANDS.indexOf(pet.band); if (i < 0) i = 1;
    return BASE[pkg][i] + (COAT_ADD[pet.coat] || 0);
  }

  /* Demo availability — deterministic so the rep sees the same calendar twice. */
  function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  var TODAY = startOfDay(new Date());
  var FIRST = new Date(TODAY); FIRST.setDate(FIRST.getDate() + 1);
  var LAST = new Date(TODAY); LAST.setDate(LAST.getDate() + 75);
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function fromIso(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function dayInfo(d) {
    var dow = d.getDay();
    if (d < FIRST || d > LAST) return { open: false, reason: 'not bookable', slots: [] };
    if (dow === 0) return { open: false, reason: 'closed', slots: [] };
    var h = (d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate() * 7) % 11;
    if (h === 0 || h === 5) return { open: false, reason: 'fully booked', slots: [], area: AREA_BY_DAY[dow] };
    var slots = SLOTS.filter(function (_, i) { return (h + i * 2) % 3 !== 0; });
    return { open: true, slots: slots, area: AREA_BY_DAY[dow] };
  }
  function nextOpenDays(n) {
    var out = [], d = new Date(FIRST);
    while (out.length < n && d <= LAST) { if (dayInfo(d).open) out.push(new Date(d)); d.setDate(d.getDate() + 1); }
    return out;
  }
  function fmtShort(d) { return DAY_NAMES[d.getDay()].slice(0, 3) + ', ' + MONTHS[d.getMonth()].slice(0, 3) + ' ' + d.getDate(); }
  function fmtLong(d) { return DAY_NAMES[d.getDay()] + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate(); }

  function zipStatus(zip) {
    if (!/^\d{5}$/.test(zip)) return 'invalid';
    var configured = ROUTE_ZIPS.filter(function (z) { return /^\d{5}$/.test(z); });
    if (configured.length) return configured.indexOf(zip) > -1 ? 'in' : 'out';
    return (+zip.charAt(4)) <= 4 ? 'in' : 'out'; // demo mode
  }

  /* ------------------------------------------------------------------
     Header: condense on scroll + mobile menu
     ------------------------------------------------------------------ */
  var header = $('.site-header');
  if (header) {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () { header.classList.toggle('is-condensed', window.scrollY > 24); ticking = false; });
    };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

    var mbtn = $('.menu-btn', header);
    var setMenu = function (open, focusBtn) {
      header.classList.toggle('menu-open', open);
      mbtn.setAttribute('aria-expanded', String(open));
      mbtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if (!open && focusBtn) mbtn.focus();
    };
    if (mbtn) {
      mbtn.addEventListener('click', function () { setMenu(!header.classList.contains('menu-open')); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && header.classList.contains('menu-open')) setMenu(false, true); });
      document.addEventListener('click', function (e) { if (header.classList.contains('menu-open') && !header.contains(e.target)) setMenu(false); });
      $$('.mobile-nav a', header).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    }
  }

  /* ------------------------------------------------------------------
     Scroll reveal (hidden state only exists under html.js; the head
     script adds .reveal-all after 2.6s as a fallback).
     ------------------------------------------------------------------ */
  var revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduced()) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ------------------------------------------------------------------
     Count-up on hero chips (placeholder figures)
     ------------------------------------------------------------------ */
  $$('[data-count]').forEach(function (el) {
    var target = +el.getAttribute('data-count'), suffix = el.getAttribute('data-suffix') || '';
    var fmt = function (n) { return n.toLocaleString('en-US') + suffix; };
    el.textContent = fmt(target);
    if (reduced()) return;
    var run = function () {
      var t0 = performance.now(), dur = 1100;
      var step = function (t) {
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(Math.round(target * e));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if ('IntersectionObserver' in window) {
      var co = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { co.disconnect(); run(); } }, { threshold: 0.4 });
      co.observe(el);
    } else run();
  });

  /* ------------------------------------------------------------------
     ZIP / service-area check (hero + route band)
     ------------------------------------------------------------------ */
  var I_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8 12.4 2.7 2.7L16 9.7"/></svg>';
  var I_PIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.3-7-11.5a7 7 0 0 1 14 0C19 14.7 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';

  function zipResultHTML(zip, status, compact) {
    if (status === 'invalid') return '<div class="zip-card zip-card--out"><h3>' + I_PIN + 'Enter a 5-digit ZIP</h3><p>For example, the ZIP where the van will park.</p></div>';
    if (status === 'in') {
      var days = nextOpenDays(3).map(function (d) { return '<li>' + esc(fmtShort(d)) + ' · ' + esc(dayInfo(d).area) + '</li>'; }).join('');
      return '<div class="zip-card zip-card--in"><h3>' + I_CHECK + esc(zip) + ' is in the route</h3>' +
        (compact ? '<p>Next open days (demo data):</p><ul class="zip-days">' + days + '</ul>' :
          '<p>Next open days <span class="ph ph--note">[AVAILABILITY — demo data]</span></p><ul class="zip-days">' + days + '</ul>' +
          '<a class="btn btn--block" href="booking.html?zip=' + encodeURIComponent(zip) + '">Book a groom in ' + esc(zip) + '</a>') + '</div>';
    }
    return '<div class="zip-card zip-card--out"><h3>' + I_PIN + esc(zip) + ' is outside the route</h3>' +
      '<p>We may add your area. Leave an email and we\'ll tell you if the route reaches you.</p>' +
      (compact ? '' : '<div class="waitlist" role="group" aria-label="Join the waitlist" data-waitlist><label class="sr-only" for="wl-' + zip + '">Email for the waitlist</label>' +
        '<input class="input" id="wl-' + zip + '" type="email" autocomplete="email" placeholder="you@example.com" required>' +
        '<button class="btn" type="button" data-wl-go>Join the waitlist</button><p class="err" aria-live="polite"></p></div>') + '</div>';
  }

  $$('[data-zipcheck]').forEach(function (form) {
    var input = $('input', form), out = $('.zip-result', form);
    input.addEventListener('input', function () { input.value = input.value.replace(/\D/g, '').slice(0, 5); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var zip = input.value.trim();
      out.innerHTML = zipResultHTML(zip, zipStatus(zip), false);
    });
    function joinWaitlist(wl) {
      var em = $('input', wl), err = $('.err', wl);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim())) { err.textContent = 'Enter an email address.'; em.setAttribute('aria-invalid', 'true'); em.focus(); return; }
      wl.outerHTML = '<p class="demo-confirm" role="status" tabindex="-1"><b>Demo:</b> you would be on the waitlist. Nothing was sent.</p>';
      var c = $('.demo-confirm', out); if (c) c.focus();
    }
    out.addEventListener('click', function (e) { var b = e.target.closest('[data-wl-go]'); if (b) joinWaitlist(b.closest('[data-waitlist]')); });
    out.addEventListener('keydown', function (e) {
      var wl = e.target.closest('[data-waitlist]');
      if (wl && e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); joinWaitlist(wl); }
    });
  });

  /* ------------------------------------------------------------------
     Radiogroup helper (roving tabindex, arrow keys)
     ------------------------------------------------------------------ */
  function radiogroup(group, onChange) {
    var btns = $$('[role="radio"]', group);
    function select(b, focus) {
      btns.forEach(function (x) { var on = x === b; x.setAttribute('aria-checked', String(on)); x.tabIndex = on ? 0 : -1; });
      if (focus) b.focus();
      onChange(b);
    }
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () { select(b); });
      b.addEventListener('keydown', function (e) {
        var k = e.key, n = null;
        if (k === 'ArrowRight' || k === 'ArrowDown') n = btns[(i + 1) % btns.length];
        else if (k === 'ArrowLeft' || k === 'ArrowUp') n = btns[(i - 1 + btns.length) % btns.length];
        else if (k === 'Home') n = btns[0]; else if (k === 'End') n = btns[btns.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
  }

  /* ------------------------------------------------------------------
     Breed / size price selector
     ------------------------------------------------------------------ */
  var pricer = $('[data-pricer]');
  if (pricer) {
    var sel = { band: 'small', coat: 'short' };
    var groups = $$('[role="radiogroup"]', pricer);
    var paint = function () {
      var pet = { species: 'dog', band: sel.band, coat: sel.coat };
      $$('[data-pkg]', pricer).forEach(function (el) {
        el.innerHTML = ph(money(priceFor(pet, el.getAttribute('data-pkg'))));
        if (!reduced()) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
      });
      $('[data-combo]', pricer).textContent = BAND_NAME[sel.band] + ' · ' + COAT_NAME[sel.coat];
      var link = $('[data-book-combo]', pricer);
      if (link) link.href = 'booking.html?band=' + sel.band + '&coat=' + sel.coat;
    };
    radiogroup(groups[0], function (b) { sel.band = b.getAttribute('data-band'); paint(); });
    radiogroup(groups[1], function (b) { sel.coat = b.getAttribute('data-coat'); paint(); });
  }

  /* ------------------------------------------------------------------
     Per visit / recurring toggle (no savings figure is ever computed)
     ------------------------------------------------------------------ */
  var freq = $('[data-freq]');
  if (freq) {
    var chip = $('[data-recur-chip]');
    $$('button', freq).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('button', freq).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        var recur = b.getAttribute('data-f') === 'recur';
        chip.hidden = !recur;
        $$('[data-unit]').forEach(function (u) {
          u.innerHTML = recur ? 'per visit on a ' + ph('[4]') + '-week schedule · recurring rate ' + ph('[CONFIRM]')
                              : 'per visit · small dog, short coat';
        });
      });
    });
  }

  /* ------------------------------------------------------------------
     Before / after sliders
     ------------------------------------------------------------------ */
  $$('[data-ba]').forEach(function (stage) {
    var wrap = stage.closest('.ba'), handle = $('.ba__handle', stage), pos = 50, dragging = false;
    function set(v, animate) {
      pos = Math.max(0, Math.min(100, Math.round(v)));
      wrap.classList.toggle('is-animating', !!animate && !reduced());
      stage.style.setProperty('--pos', pos + '%');
      handle.setAttribute('aria-valuenow', String(pos));
      handle.setAttribute('aria-valuetext', pos + '% after');
    }
    function fromEvent(e) { var r = stage.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * 100; }
    stage.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      dragging = true; stage.setPointerCapture(e.pointerId);
      set(fromEvent(e), e.target !== handle);
      if (e.target === handle || e.pointerType === 'mouse') e.preventDefault();
      handle.focus({ preventScroll: true });
    });
    stage.addEventListener('pointermove', function (e) { if (dragging) set(fromEvent(e), false); });
    var end = function () { dragging = false; };
    stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
    handle.addEventListener('keydown', function (e) {
      var step = e.shiftKey ? 10 : 5, v = null;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') v = pos - step;
      else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') v = pos + step;
      else if (e.key === 'PageDown') v = pos - 20; else if (e.key === 'PageUp') v = pos + 20;
      else if (e.key === 'Home') v = 0; else if (e.key === 'End') v = 100;
      if (v !== null) { e.preventDefault(); set(v, true); }
    });
  });

  /* ------------------------------------------------------------------
     FAQ accordion
     ------------------------------------------------------------------ */
  $$('.faq__q').forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      if (open) {
        if (reduced()) { panel.hidden = true; return; }
        panel.style.height = panel.scrollHeight + 'px';
        requestAnimationFrame(function () { panel.style.height = '0px'; });
        setTimeout(function () { panel.hidden = true; panel.style.height = ''; }, 270);
      } else {
        panel.hidden = false;
        if (reduced()) return;
        var h = panel.scrollHeight; panel.style.height = '0px';
        requestAnimationFrame(function () { panel.style.height = h + 'px'; });
        setTimeout(function () { panel.style.height = ''; }, 280);
      }
    });
  });

  /* ------------------------------------------------------------------
     Gallery: filter pills + lightbox
     ------------------------------------------------------------------ */
  var filters = $$('[data-filter]');
  if (filters.length) {
    var tiles = $$('.tile'), status = $('[data-filter-status]');
    filters.forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.getAttribute('data-filter'), shown = 0;
        filters.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        tiles.forEach(function (t) {
          var cats = (t.getAttribute('data-cats') || '').split(' ');
          var on = f === 'all' || cats.indexOf(f) > -1;
          t.hidden = !on;
          if (on) { shown++; t.classList.add('is-in'); if (!reduced()) { t.classList.remove('is-entering'); void t.offsetWidth; t.classList.add('is-entering'); } }
        });
        if (status) status.textContent = shown + ' photos shown';
      });
    });
  }
  var lb = $('[data-lightbox]');
  if (lb) {
    var lbImg = $('img', lb), lbCap = $('figcaption', lb), lbClose = $('.lightbox__close', lb);
    var lbPrev = $('.lightbox__nav--prev', lb), lbNext = $('.lightbox__nav--next', lb);
    var current = 0, opener = null;
    var visible = function () { return $$('.tile:not([hidden]) button[data-lb]'); };
    var show = function (i) {
      var list = visible(); if (!list.length) return;
      current = (i + list.length) % list.length;
      var b = list[current];
      lbImg.src = b.getAttribute('data-full'); lbImg.alt = b.getAttribute('data-alt');
      lbCap.textContent = b.getAttribute('data-cap') + ' — ' + (current + 1) + ' of ' + list.length;
    };
    var close = function () { lb.hidden = true; document.body.style.overflow = ''; if (opener) opener.focus(); };
    $$('button[data-lb]').forEach(function (b) {
      b.addEventListener('click', function () {
        opener = b; lb.hidden = false; document.body.style.overflow = 'hidden';
        show(visible().indexOf(b)); lbClose.focus();
      });
    });
    lbClose.addEventListener('click', close);
    lbPrev.addEventListener('click', function () { show(current - 1); });
    lbNext.addEventListener('click', function () { show(current + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowLeft') show(current - 1);
      else if (e.key === 'ArrowRight') show(current + 1);
      else if (e.key === 'Tab') {
        var f = [lbClose, lbPrev, lbNext], i = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
  }

  /* ------------------------------------------------------------------
     Generic demo forms (contact)
     ------------------------------------------------------------------ */
  function validateField(el) {
    var err = el.parentNode.querySelector('.err'), msg = '';
    var v = (el.value || '').trim();
    if (el.required && !v) msg = 'This field is needed.';
    else if (el.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) msg = 'Enter an email address like name@example.com.';
    else if (el.type === 'tel' && el.required && v.replace(/\D/g, '').length < 7) msg = 'Enter a phone number.';
    else if (el.name === 'zip' && el.required && !/^\d{5}$/.test(v)) msg = 'Enter a 5-digit ZIP.';
    if (err) err.textContent = msg;
    if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
    return !msg;
  }
  $$('[data-demo-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = $$('input, textarea, select', form).filter(function (el) { return !validateField(el); });
      if (bad.length) { bad[0].focus(); return; }
      $('.form-status', form).innerHTML = '<div class="demo-confirm" role="status"><h3>' + I_CHECK + 'Question received — demo</h3><p>This is a demo form. Nothing was sent or stored.</p></div>';
      form.reset();
    });
  });

  /* ------------------------------------------------------------------
     Booking flow
     ------------------------------------------------------------------ */
  var flow = $('[data-flow]');
  if (!flow) return;
  document.body.classList.add('has-pbar');

  var params = new URLSearchParams(location.search);
  var state = {
    step: 1, zip: '', parking: '', date: null, slot: null,
    pets: []
  };
  var STEP_LABEL = ['', 'Where', 'Pet', 'Package', 'When', 'You'];
  var NEXT_LABEL = ['', 'Next: your pet', 'Next: package', 'Next: day and time', 'Next: your details', 'Confirm booking'];
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>';

  function newPet() {
    return { name: '', breed: '', species: 'dog', band: 'small', coat: 'short', cond: 'good', age: '', notes: '', pkg: 'full', addons: [] };
  }
  var p0 = newPet();
  if (BANDS.indexOf(params.get('band')) > -1) p0.band = params.get('band');
  if (COAT_ADD.hasOwnProperty(params.get('coat'))) p0.coat = params.get('coat');
  if (PKG_NAME.hasOwnProperty(params.get('pkg'))) p0.pkg = params.get('pkg');
  state.pets.push(p0);

  var zipIn = $('#f-zip'), zipInline = $('[data-zip-inline]');
  if (/^\d{5}$/.test(params.get('zip') || '')) { zipIn.value = params.get('zip'); state.zip = zipIn.value; }
  var pk = params.get('parking');
  if (pk) { var r = flow.querySelector('input[name="parking"][value="' + pk.replace(/[^a-z]/g, '') + '"]'); if (r) { r.checked = true; state.parking = r.value; } }

  function paintZip() {
    var z = zipIn.value.trim();
    zipInline.innerHTML = /^\d{5}$/.test(z) ? zipResultHTML(z, zipStatus(z), true) : '';
  }
  zipIn.addEventListener('input', function () { zipIn.value = zipIn.value.replace(/\D/g, '').slice(0, 5); state.zip = zipIn.value; if (zipIn.value.length === 5) paintZip(); else zipInline.innerHTML = ''; summary(); });
  $$('input[name="parking"]', flow).forEach(function (r) { r.addEventListener('change', function () { state.parking = r.value; $('[data-err="parking"]').textContent = ''; }); });
  if (state.zip) paintZip();

  /* --- pets (step 2) --- */
  var petsBox = $('[data-pets]'), tpl = $('#pet-tpl'), addBtn = $('[data-add-pet]');
  function renderPets() {
    petsBox.innerHTML = '';
    state.pets.forEach(function (pet, i) {
      var frag = tpl.content.cloneNode(true), block = $('[data-pet]', frag);
      $('[data-pet-title]', block).textContent = 'Pet ' + (i + 1);
      $$('[data-for]', block).forEach(function (l) { l.setAttribute('for', 'p' + i + '-' + l.getAttribute('data-for')); });
      $$('[data-f]', block).forEach(function (el) {
        var f = el.getAttribute('data-f');
        if (el.type === 'radio') { el.name = 'p' + i + '-' + f; el.checked = pet[f] === el.value; }
        else { el.id = 'p' + i + '-' + f; el.name = 'p' + i + '-' + f; if (pet[f]) el.value = pet[f]; else if (el.tagName === 'SELECT') pet[f] = el.value; }
        var upd = function () { if (el.type === 'radio') { if (el.checked) pet[f] = el.value; } else pet[f] = el.value; summary(); };
        el.addEventListener('input', upd); el.addEventListener('change', upd);
      });
      var rm = $('[data-remove-pet]', block);
      if (i > 0) { rm.hidden = false; rm.setAttribute('aria-label', 'Remove pet ' + (i + 1)); rm.addEventListener('click', function () { state.pets.splice(i, 1); renderPets(); summary(); addBtn.focus(); }); }
      petsBox.appendChild(frag);
    });
    addBtn.hidden = state.pets.length >= 2;
  }
  addBtn.addEventListener('click', function () {
    state.pets.push(newPet()); renderPets(); summary();
    var f = $('#p' + (state.pets.length - 1) + '-name'); if (f) f.focus();
  });

  /* --- packages (step 3) --- */
  var pkgBox = $('[data-pkgs]');
  function renderPkgs() {
    pkgBox.innerHTML = state.pets.map(function (pet, i) {
      var nm = pet.name || ('Pet ' + (i + 1));
      var who = pet.species === 'cat' ? 'Cat ' + ph('[CAT PRICING — CONFIRM]', 'ph--note') : esc(BAND_NAME[pet.band]) + ' · ' + esc(COAT_NAME[pet.coat]);
      var opts = ['tidy', 'full', 'works'].map(function (k) {
        return '<label class="opt opt--pkg"><input type="radio" name="pkg-' + i + '" value="' + k + '"' + (pet.pkg === k ? ' checked' : '') + '>' +
          '<span>' + PKG_NAME[k] + (k === 'full' ? ' <small>Most booked</small>' : '') + '<b class="opt__price">' + ph(money(priceFor(pet, k))) + '</b><small>' + phText(PKG_DESC[k]) + '</small></span></label>';
      }).join('');
      var adds = ADDONS.map(function (a) {
        return '<label class="check"><input type="checkbox" name="add-' + i + '" value="' + a.k + '"' + (pet.addons.indexOf(a.k) > -1 ? ' checked' : '') + '><span>' + phText(a.n) + '</span><b>' + ph('+' + money(a.p)) + '</b></label>';
      }).join('');
      return '<div class="pkg-pet"><fieldset><legend><h3>' + esc(nm) + ' <small style="font-weight:500;font-size:.85rem">' + who + '</small></h3></legend>' +
        '<div class="opt-grid opt-grid--3">' + opts + '</div></fieldset>' +
        '<fieldset><legend class="label" style="margin-top:14px">Add-ons for ' + esc(nm) + '</legend><div class="addon-list">' + adds + '</div></fieldset></div>';
    }).join('');
  }
  pkgBox.addEventListener('change', function (e) {
    var t = e.target, m = /^(pkg|add)-(\d+)$/.exec(t.name); if (!m) return;
    var pet = state.pets[+m[2]];
    if (m[1] === 'pkg') pet.pkg = t.value;
    else pet.addons = $$('input[name="add-' + m[2] + '"]:checked', pkgBox).map(function (x) { return x.value; });
    summary();
  });

  /* --- calendar (step 4) --- */
  var calGrid = $('[data-cal-grid] tbody'), calTitle = $('[data-cal-title]');
  var calPrev = $('[data-cal-prev]'), calNext = $('[data-cal-next]');
  var view = new Date(FIRST.getFullYear(), FIRST.getMonth(), 1);
  var focusDate = new Date(FIRST);
  (function () { // if the first month has only a few open days left, open on the next month
    var open = 0, d = new Date(FIRST);
    while (d.getMonth() === FIRST.getMonth()) { if (dayInfo(d).open) open++; d.setDate(d.getDate() + 1); }
    if (open < 4) { view = new Date(FIRST.getFullYear(), FIRST.getMonth() + 1, 1); focusDate = new Date(view); }
  })();
  var slotsBox = $('[data-slots]'), dayInfoEl = $('[data-day-info]');

  function renderCal(focusIt) {
    calTitle.textContent = MONTHS[view.getMonth()] + ' ' + view.getFullYear();
    var minView = new Date(FIRST.getFullYear(), FIRST.getMonth(), 1), maxView = new Date(LAST.getFullYear(), LAST.getMonth(), 1);
    calPrev.disabled = view <= minView; calNext.disabled = view >= maxView;
    if (focusDate.getMonth() !== view.getMonth() || focusDate.getFullYear() !== view.getFullYear()) {
      var f = new Date(view); var guard = 0;
      while (!dayInfo(f).open && f.getMonth() === view.getMonth() && guard++ < 31) f.setDate(f.getDate() + 1);
      focusDate = f.getMonth() === view.getMonth() ? f : new Date(view);
    }
    var first = view.getDay(), days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    var html = '<tr>', col = 0;
    for (var e = 0; e < first; e++) { html += '<td></td>'; col++; }
    for (var d = 1; d <= days; d++) {
      var dt = new Date(view.getFullYear(), view.getMonth(), d), info = dayInfo(dt), id = iso(dt);
      var selected = state.date === id, isFocus = iso(focusDate) === id;
      var label = fmtLong(dt) + (info.open ? ', ' + info.slots.length + ' times open, route ' + info.area : ', ' + info.reason);
      html += '<td role="gridcell" aria-selected="' + selected + '"><button type="button" class="day' + '" data-date="' + id + '"' +
        (info.open ? '' : ' aria-disabled="true"') + ' tabindex="' + (isFocus ? 0 : -1) + '" aria-label="' + esc(label) + '">' + d + '</button></td>';
      col++;
      if (col === 7 && d < days) { html += '</tr><tr>'; col = 0; }
    }
    while (col < 7 && col > 0) { html += '<td></td>'; col++; }
    calGrid.innerHTML = html + '</tr>';
    if (focusIt) { var fb = $('.day[tabindex="0"]', calGrid); if (fb) fb.focus(); }
  }
  function moveFocus(delta, days) {
    var nd = new Date(focusDate);
    if (days) nd.setDate(nd.getDate() + delta); else nd.setMonth(nd.getMonth() + delta);
    var minD = new Date(FIRST.getFullYear(), FIRST.getMonth(), 1);
    var maxD = new Date(LAST.getFullYear(), LAST.getMonth() + 1, 0);
    if (nd < minD || nd > maxD) return;
    focusDate = nd;
    view = new Date(nd.getFullYear(), nd.getMonth(), 1);
    renderCal(true);
  }
  function chooseDate(id) {
    var dt = fromIso(id), info = dayInfo(dt);
    if (!info.open) { dayInfoEl.textContent = fmtLong(dt) + ' is ' + info.reason + '. Choose another day.'; return; }
    state.date = id; state.slot = null; focusDate = dt;
    renderCal(true);
    var btn = $('.day[data-date="' + id + '"]', calGrid);
    if (btn && !reduced()) { btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop'); }
    dayInfoEl.innerHTML = esc(fmtLong(dt)) + ' · route ' + ph(info.area) + ' · ' + info.slots.length + ' open times';
    slotsBox.innerHTML = info.slots.map(function (s, i) {
      return '<label class="opt"><input type="radio" name="slot" value="' + esc(s) + '"><span>' + ph(s) + '<small>Arrival window ' + ph('[CONFIRM]', 'ph--note') + '</small></span></label>';
    }).join('');
    $('[data-err="slot"]').textContent = '';
    summary();
  }
  calGrid.addEventListener('click', function (e) { var b = e.target.closest('.day'); if (b) chooseDate(b.getAttribute('data-date')); });
  calGrid.addEventListener('keydown', function (e) {
    var b = e.target.closest('.day'); if (!b) return;
    var k = e.key;
    if (k === 'ArrowRight') { e.preventDefault(); moveFocus(1, true); }
    else if (k === 'ArrowLeft') { e.preventDefault(); moveFocus(-1, true); }
    else if (k === 'ArrowDown') { e.preventDefault(); moveFocus(7, true); }
    else if (k === 'ArrowUp') { e.preventDefault(); moveFocus(-7, true); }
    else if (k === 'Home') { e.preventDefault(); moveFocus(-focusDate.getDay(), true); }
    else if (k === 'End') { e.preventDefault(); moveFocus(6 - focusDate.getDay(), true); }
    else if (k === 'PageDown') { e.preventDefault(); moveFocus(1, false); }
    else if (k === 'PageUp') { e.preventDefault(); moveFocus(-1, false); }
    else if (k === 'Enter' || k === ' ') { e.preventDefault(); chooseDate(b.getAttribute('data-date')); }
  });
  calPrev.addEventListener('click', function () { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); renderCal(false); });
  calNext.addEventListener('click', function () { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderCal(false); });
  slotsBox.addEventListener('change', function (e) { if (e.target.name === 'slot') { state.slot = e.target.value; $('[data-err="slot"]').textContent = ''; summary(); } });

  /* --- summary + running total --- */
  var lastTotal = null;
  function petTotal(pet) {
    return priceFor(pet, pet.pkg) + pet.addons.reduce(function (s, k) { var a = ADDONS.filter(function (x) { return x.k === k; })[0]; return s + (a ? a.p : 0); }, 0);
  }
  function summary() {
    var total = 0, rows = '';
    state.pets.forEach(function (pet, i) {
      var base = priceFor(pet, pet.pkg); total += petTotal(pet);
      rows += '<li class="pet"><span>' + esc(pet.name || 'Pet ' + (i + 1)) + '</span><span></span></li>';
      rows += '<li class="sub"><span>' + PKG_NAME[pet.pkg] + ' · ' + (pet.species === 'cat' ? 'Cat' : esc(BAND_NAME[pet.band]) + ', ' + esc(COAT_NAME[pet.coat].toLowerCase())) + '</span><span>' + ph(money(base)) + '</span></li>';
      pet.addons.forEach(function (k) {
        var a = ADDONS.filter(function (x) { return x.k === k; })[0];
        if (a) rows += '<li class="sub"><span>+ ' + phText(a.n) + '</span><span>' + ph(money(a.p)) + '</span></li>';
      });
    });
    var when = state.date ? esc(fmtLong(fromIso(state.date))) + (state.slot ? ' · ' + ph(state.slot) : ' · time not chosen') : 'Day and time not chosen yet';
    var where = state.zip ? 'ZIP ' + esc(state.zip) : 'ZIP not entered';
    var html = '<ul class="sum-list">' + rows + '</ul><div class="sum-when">' + when + '<br>' + where + '</div>' +
      '<div class="sum-total"><b>Estimated total</b><strong' + (lastTotal !== null && lastTotal !== total && !reduced() ? ' class="flash"' : '') + '>' + ph(money(total)) + '</strong></div>' +
      '<p class="sum-note">Placeholder figures. Final price confirmed at the van. ' + ph('[SURCHARGE POLICY — CONFIRM]', 'ph--note') + '</p>';
    $$('[data-summary]').forEach(function (s) { s.innerHTML = html; });
    var pt = $('[data-pbar-total]'); if (pt) pt.textContent = money(total);
    lastTotal = total;
    return html;
  }

  var pbarBtn = $('.pbar__toggle'), pbarBody = $('#pbar-body');
  if (pbarBtn) pbarBtn.addEventListener('click', function () {
    var open = pbarBtn.getAttribute('aria-expanded') === 'true';
    pbarBtn.setAttribute('aria-expanded', String(!open)); pbarBody.hidden = open;
  });

  /* --- step validation --- */
  function validate(step) {
    var ok = true, firstBad = null;
    function bad(el) { ok = false; if (!firstBad) firstBad = el; }
    if (step === 1) {
      if (!validateField(zipIn)) bad(zipIn);
      else if (zipStatus(zipIn.value) === 'out') {
        zipIn.parentNode.querySelector('.err').textContent = 'This ZIP is outside the route in the demo. Try one ending 0–4, or join the waitlist from the home page.';
        zipIn.setAttribute('aria-invalid', 'true'); bad(zipIn);
      }
      if (!state.parking) { $('[data-err="parking"]').textContent = 'Choose where the van can park.'; bad($('input[name="parking"]', flow)); }
    } else if (step === 2) {
      $$('[data-pet] input[type="text"]', petsBox).forEach(function (el) { if (!validateField(el)) bad(el); });
    } else if (step === 4) {
      if (!state.date) { dayInfoEl.textContent = 'Choose a day first.'; bad($('.day[tabindex="0"]', calGrid) || calNext); }
      else if (!state.slot) { $('[data-err="slot"]').textContent = 'Choose a time.'; bad($('input[name="slot"]', slotsBox)); }
    } else if (step === 5) {
      $$('[data-step="5"] .field input', flow).forEach(function (el) { if (!validateField(el)) bad(el); });
      var acks = $$('[data-step="5"] input[name^="ack-"]', flow), unchecked = acks.filter(function (a) { return !a.checked; });
      $('[data-err="acks"]').textContent = unchecked.length ? 'Please confirm each item above.' : '';
      if (unchecked.length) bad(unchecked[0]);
    }
    if (firstBad) firstBad.focus();
    return ok;
  }

  /* --- step navigation --- */
  var backBtn = $('[data-back]'), nextBtn = $('[data-next]'), statusEl = $('#flow-status');
  var bar = $('.progress__bar'), fill = $('.progress__fill'), crumbs = $$('.progress__steps li');
  var barNext = $('[data-bar-next]');
  function go(n, focus) {
    state.step = n;
    $$('.step', flow).forEach(function (s) {
      var on = +s.getAttribute('data-step') === n;
      s.hidden = !on; s.classList.toggle('is-shown', on && !reduced());
    });
    var shownStep = Math.min(n, 5);
    fill.style.width = (n > 5 ? 100 : n * 20) + '%';
    bar.setAttribute('aria-valuenow', String(shownStep));
    crumbs.forEach(function (li, i) {
      if (i + 1 === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
      li.classList.toggle('done', i + 1 < n);
    });
    statusEl.textContent = n > 5 ? 'Done · request received (demo)' : 'Step ' + n + ' of 5 · ' + STEP_LABEL[n];
    backBtn.hidden = n === 1 || n > 5;
    nextBtn.hidden = n > 5;
    nextBtn.innerHTML = (NEXT_LABEL[n] || '') + ' ' + ARROW;
    if (barNext) { barNext.innerHTML = (n === 5 ? 'Confirm booking ' : 'Next step ') + ARROW; barNext.parentNode.hidden = n > 5; }
    if (n === 2) renderPets();
    if (n === 3) renderPkgs();
    if (n === 4) renderCal(false);
    if (n > 5) {
      $('[data-confirm-summary]').innerHTML = '<div class="summary" style="box-shadow:none">' + summary() + '</div>';
      var pbar = $('[data-pbar]'); if (pbar) pbar.hidden = true;
      document.body.classList.remove('has-pbar');
    }
    if (focus) {
      var target = $('.step[data-step="' + n + '"]', flow);
      $('#flow-top').scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
      target.focus({ preventScroll: true });
    }
  }
  flow.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate(state.step)) return;
    go(state.step + 1, true);
  });
  backBtn.addEventListener('click', function () { go(Math.max(1, state.step - 1), true); });
  if (barNext) barNext.addEventListener('click', function () {
    if (flow.requestSubmit) flow.requestSubmit(nextBtn); else nextBtn.click();
  });

  renderPets();
  summary();
  go(1, false);
})();
