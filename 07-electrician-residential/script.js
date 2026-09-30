/* Northbeam Electric Co. — demo template 07. Plain JS, no dependencies.
   Forms are client-side only: nothing is transmitted anywhere. */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  /* ---------- Header condense at 120px + slash skew over first 300px ---------- */
  var head = document.querySelector('.site-head');
  var slashes = document.querySelectorAll('[data-slash]');
  var ticking = false;
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (head) head.classList.toggle('is-condensed', y > 120);
    if (!reduce) {
      var p = Math.min(Math.max(y / 300, 0), 1);
      var skew = (-1 - 2 * p).toFixed(3) + 'deg';
      slashes.forEach(function (s) { s.style.setProperty('--skew', skew); });
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  if (reduce) slashes.forEach(function (s) { s.style.setProperty('--skew', '-3deg'); });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var menuBtn = document.querySelector('.icon-btn.menu');
  var mnav = document.getElementById('mnav');
  var lastFocus = null;
  function openMenu() {
    if (!mnav) return;
    lastFocus = document.activeElement;
    mnav.hidden = false;
    // force reflow so the transition runs
    void mnav.offsetWidth;
    mnav.classList.add('open');
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    var first = mnav.querySelector('.mnav-close');
    if (first) first.focus();
  }
  function closeMenu() {
    if (!mnav || !mnav.classList.contains('open')) return;
    mnav.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    window.setTimeout(function () { if (!mnav.classList.contains('open')) mnav.hidden = true; }, reduce ? 0 : 200);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  if (menuBtn && mnav) {
    menuBtn.addEventListener('click', openMenu);
    mnav.querySelector('.mnav-close').addEventListener('click', closeMenu);
    mnav.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', function (e) {
      if (!mnav.classList.contains('open')) return;
      if (e.key === 'Escape') { closeMenu(); return; }
      if (e.key === 'Tab') {
        var f = mnav.querySelectorAll('a[href], button:not([disabled])');
        if (!f.length) return;
        var a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1080) closeMenu(); });
  }

  /* ---------- Scroll reveal (gated, with timed fallback) ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  document.querySelectorAll('[data-stagger]').forEach(function (g) {
    g.querySelectorAll(':scope > .reveal').forEach(function (el, i) { el.style.setProperty('--i', i); });
  });
  function showAll() { reveals.forEach(function (el) { el.classList.add('is-in'); }); }
  if (!reduce && 'IntersectionObserver' in window && reveals.length) {
    doc.classList.add('js-reveal');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
    // Anything already in view on load (and a hard fallback so nothing stays hidden)
    window.setTimeout(function () {
      reveals.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-in');
      });
    }, 60);
    window.setTimeout(showAll, 3000);
  } else {
    showAll();
  }

  /* ---------- Count-up (About figures; brackets stay visible) ---------- */
  function fmt(n) { return n.toLocaleString('en-US'); }
  var counters = document.querySelectorAll('[data-count]');
  function runCount(el) {
    var end = parseInt(el.getAttribute('data-count'), 10) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = fmt(end) + suffix; return; }
    var t0 = null, dur = 900;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(end * eased)) + (p === 1 ? suffix : '');
      if (p < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }
  if (counters.length) {
    if (!reduce && 'IntersectionObserver' in window) {
      counters.forEach(function (el) { el.textContent = '0'; });
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { runCount(en.target); cio.unobserve(en.target); } });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { cio.observe(el); });
      window.setTimeout(function () { counters.forEach(function (el) { if (el.textContent === '0') runCount(el); }); }, 4000);
    } else {
      counters.forEach(runCount);
    }
  }

  /* ---------- ZIP check (static demo states) ---------- */
  var STATES = {
    in: { title: 'In our area', body: 'Standard booking applies. Call or send a photo and the office will take it from there.' },
    edge: { title: 'Edge of our area', body: 'We may be able to cover this address — call the office to confirm before booking.' },
    out: { title: 'Outside our area', body: 'This ZIP looks outside the area we cover. We would rather say so now than after a callout.' }
  };
  function zipState(zip) {
    // Demo only: deterministic by last digit. Replace with the confirmed ZIP list at build.
    var d = parseInt(zip.charAt(4), 10);
    if (d <= 5) return 'in';
    if (d <= 7) return 'edge';
    return 'out';
  }
  document.querySelectorAll('.zip-form').forEach(function (form) {
    var input = form.querySelector('input');
    var err = form.querySelector('.err');
    var box = form.parentNode.querySelector('.zip-result');
    input.addEventListener('input', function () { input.value = input.value.replace(/\D/g, '').slice(0, 5); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value.trim();
      if (!/^\d{5}$/.test(v)) {
        input.setAttribute('aria-invalid', 'true');
        err.textContent = 'Please enter a 5-digit ZIP code.';
        err.style.display = 'block';
        box.className = 'zip-result';
        box.innerHTML = '';
        input.focus();
        return;
      }
      input.removeAttribute('aria-invalid');
      err.textContent = '';
      err.style.display = 'none';
      var s = zipState(v);
      var st = STATES[s];
      var actions = s === 'out'
        ? '<a class="btn btn-line" href="tel:+10000000000">Call anyway</a>'
        : '<a class="btn btn-dark" href="tel:+10000000000">Call the office</a><a class="btn btn-line" href="' + (document.getElementById('quote') ? '#quote' : 'contact.html#quote') + '">Send a photo</a>';
      box.className = 'zip-result show ' + s;
      box.innerHTML = '<p class="state"><span class="sq" aria-hidden="true"></span>' + st.title + ' · <span class="mono">' + v + '</span></p>' +
        '<p>' + st.body + '</p><p class="mono" style="font-size:.8125rem">Demo result. Confirmed boundary: <span class="ph">[SERVICE AREA — CONFIRM]</span></p>' +
        '<div class="actions">' + actions + '</div>';
    });
  });

  /* ---------- Forms: validation + demo confirmation ---------- */
  function setInvalid(field, bad) {
    var wrap = field.closest('.field');
    if (bad) { field.setAttribute('aria-invalid', 'true'); if (wrap) wrap.classList.add('invalid'); }
    else { field.removeAttribute('aria-invalid'); if (wrap) wrap.classList.remove('invalid'); }
  }
  function validate(form) {
    var firstBad = null;
    form.querySelectorAll('[required]').forEach(function (f) {
      var v = (f.value || '').trim();
      var bad = !v;
      if (!bad && f.name === 'zip') bad = !/^\d{5}$/.test(v);
      if (!bad && f.type === 'tel') bad = v.replace(/\D/g, '').length < 7;
      setInvalid(f, bad);
      if (bad && !firstBad) firstBad = f;
    });
    return firstBad;
  }

  document.querySelectorAll('form[data-form]').forEach(function (form) {
    form.querySelectorAll('input[name="zip"]').forEach(function (z) {
      z.addEventListener('input', function () { z.value = z.value.replace(/\D/g, '').slice(0, 5); });
    });
    form.querySelectorAll('[required]').forEach(function (f) {
      ['blur', 'input'].forEach(function (ev) {
        f.addEventListener(ev, function () { if (f.getAttribute('aria-invalid')) validate(form); });
      });
    });

    /* photo previews (quote form) */
    var file = form.querySelector('input[type="file"]');
    var list = form.querySelector('.previews');
    var picked = [];
    function render() {
      if (!list) return;
      list.querySelectorAll('img').forEach(function (i) { URL.revokeObjectURL(i.src); });
      list.innerHTML = '';
      picked.forEach(function (f, idx) {
        var li = document.createElement('li');
        var im = document.createElement('img');
        im.src = URL.createObjectURL(f);
        im.alt = 'Selected photo ' + (idx + 1) + ': ' + f.name;
        var nm = document.createElement('span');
        nm.className = 'fname'; nm.textContent = f.name;
        var rm = document.createElement('button');
        rm.type = 'button';
        rm.setAttribute('aria-label', 'Remove ' + f.name);
        rm.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
        rm.addEventListener('click', function () { picked.splice(idx, 1); render(); if (file) file.focus(); });
        li.appendChild(im); li.appendChild(nm); li.appendChild(rm);
        list.appendChild(li);
      });
    }
    if (file) {
      var drop = file.closest('.upload');
      file.addEventListener('change', function () {
        Array.prototype.forEach.call(file.files, function (f) {
          if (/^image\//.test(f.type) && picked.length < 4) picked.push(f);
        });
        file.value = '';
        render();
      });
      ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function () { drop.classList.add('drag'); }); });
      ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function () { drop.classList.remove('drag'); }); });
    }

    var done = form.parentNode.querySelector('.form-done') || form.querySelector('.form-done');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = validate(form);
      if (bad) { bad.focus(); return; }
      if (form.getAttribute('data-form') === 'quote') {
        form.hidden = true;
        var n = done.querySelector('.count');
        if (!n) {
          n = document.createElement('p');
          n.className = 'count';
          done.insertBefore(n, done.querySelector('[data-reset]'));
        }
        n.textContent = picked.length ? picked.length + ' photo' + (picked.length > 1 ? 's' : '') + ' attached (kept in your browser only).' : 'No photos attached.';
      } else {
        form.querySelectorAll('.field, button[type="submit"]').forEach(function (el) { el.hidden = true; });
      }
      done.classList.add('show');
      done.focus();
    });
    if (done) {
      var reset = done.querySelector('[data-reset]');
      if (reset) reset.addEventListener('click', function () {
        form.reset(); picked = []; render();
        done.classList.remove('show');
        form.hidden = false;
        var first = form.querySelector('input, textarea, select');
        if (first) first.focus();
      });
    }
  });
})();
