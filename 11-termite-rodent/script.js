/* Ledgerwood Termite & Rodent — fictional demo. Client-side only; no data leaves the page. */
(function () {
  'use strict';
  window.LDG_OK = true;
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header condense at 90px ---------- */
  var head = document.querySelector('[data-head]');
  if (head) {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        head.classList.toggle('condensed', window.scrollY > 90);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobile nav ---------- */
  var menuBtn = document.querySelector('[data-menu]');
  var mnav = document.getElementById('mnav');
  if (menuBtn && mnav) {
    menuBtn.addEventListener('click', function () {
      var open = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', String(!open));
      mnav.classList.toggle('open', !open);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mnav.classList.contains('open')) {
        mnav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.focus();
      }
    });
  }

  /* ---------- Count-up (brackets stay visible; only the digits animate) ---------- */
  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(target)) return;
    var fmt = function (n) { return n.toLocaleString('en-US'); };
    if (reduce) { el.textContent = fmt(target); return; }
    var start = null, dur = 1000;
    el.textContent = '0';
    var step = function (ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 2); /* linear-out */
      el.textContent = fmt(Math.round(target * eased));
      if (p < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }

  /* ---------- Reveal / rule draws / timeline ---------- */
  var targets = document.querySelectorAll('.rv, .eyebrow, .tl, [data-count]');
  function show(el) {
    if (el.classList.contains('rv')) el.classList.add('in');
    if (el.classList.contains('eyebrow') || el.classList.contains('tl')) el.classList.add('drawn');
    if (el.hasAttribute('data-count') && !el.dataset.done) { el.dataset.done = '1'; countUp(el); }
  }
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { show(en.target); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(show);
  }

  /* ---------- Accordions (report anatomy + FAQ) ---------- */
  document.querySelectorAll('[data-acc] .acc-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var row = btn.closest('.acc-row');
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      row.classList.toggle('open', !open);
    });
  });

  /* ---------- House-section diagram: marker <-> list linking ---------- */
  document.querySelectorAll('[data-diagram]').forEach(function (wrap) {
    var pts = wrap.querySelectorAll('.pt');
    var items = wrap.querySelectorAll('.keylist li');
    function hl(n, on) {
      pts.forEach(function (p) { p.classList.toggle('hl', on && p.getAttribute('data-pt') === n); });
      items.forEach(function (li) { li.classList.toggle('hl', on && li.getAttribute('data-pt') === n); });
    }
    pts.forEach(function (p) {
      var n = p.getAttribute('data-pt');
      p.addEventListener('mouseenter', function () { hl(n, true); });
      p.addEventListener('mouseleave', function () { hl(n, false); });
      p.addEventListener('focus', function () { hl(n, true); });
      p.addEventListener('blur', function () { hl(n, false); });
    });
    items.forEach(function (li) {
      var n = li.getAttribute('data-pt');
      li.addEventListener('mouseenter', function () { hl(n, true); });
      li.addEventListener('mouseleave', function () { hl(n, false); });
    });
  });

  /* ---------- Photo previews on upload fields ---------- */
  document.querySelectorAll('input[type="file"][data-preview]').forEach(function (input) {
    var out = document.getElementById(input.getAttribute('data-preview'));
    var hint = input.closest('.upload') ? input.closest('.upload').querySelector('.upload-count') : null;
    input.addEventListener('change', function () {
      if (!out) return;
      out.innerHTML = '';
      var files = Array.prototype.slice.call(input.files || [], 0, 6);
      files.forEach(function (f, i) {
        if (!/^image\//.test(f.type)) return;
        var fig = document.createElement('figure');
        var img = document.createElement('img');
        img.src = URL.createObjectURL(f);
        img.alt = 'Selected photo ' + (i + 1) + ' preview';
        img.onload = function () { URL.revokeObjectURL(img.src); };
        var cap = document.createElement('figcaption');
        cap.textContent = f.name;
        fig.appendChild(img); fig.appendChild(cap); out.appendChild(fig);
      });
      if (hint) hint.textContent = files.length ? files.length + ' photo' + (files.length > 1 ? 's' : '') + ' attached (demo — not uploaded)' : 'No photo attached';
    });
  });

  /* ---------- Demo forms: validate, never send ---------- */
  document.querySelectorAll('form[data-demo-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var ok = form.querySelector('.form-ok');
      if (ok) {
        ok.classList.add('show');
        ok.setAttribute('tabindex', '-1');
        ok.focus();
      }
    });
  });

  /* ---------- Service-area ZIP check (demo logic, three bracketed states) ---------- */
  var ZIP_STATES = {
    inside: '<span class="mono hi">IN AREA</span><br>[IN-AREA MESSAGE — CONFIRM] Looks like we cover this ZIP. Inspection availability: [INSPECTION AVAILABILITY — CONFIRM].',
    edge: '<span class="mono hi">CALL TO CONFIRM</span><br>[EDGE-OF-AREA MESSAGE — CONFIRM] This ZIP is near the edge of our area. Call [PHONE — CONFIRM] and we will confirm.',
    outside: '<span class="mono hi">OUTSIDE AREA</span><br>[OUT-OF-AREA MESSAGE — CONFIRM] This ZIP looks outside our current area. [REFERRAL POLICY — CONFIRM]'
  };
  document.querySelectorAll('form[data-zip]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input');
      var out = document.getElementById(form.getAttribute('data-zip'));
      var v = (input.value || '').trim();
      if (!/^\d{5}$/.test(v)) {
        out.innerHTML = '<span class="err">Enter a 5-digit ZIP code.</span>';
        input.setAttribute('aria-invalid', 'true');
        input.focus();
        return;
      }
      input.removeAttribute('aria-invalid');
      /* Demo only: the last digit picks a state so all three can be shown. The live site uses the client's real ZIP list. */
      var d = parseInt(v.charAt(4), 10);
      var state = d <= 5 ? 'inside' : (d <= 7 ? 'edge' : 'outside');
      out.innerHTML = '<span class="state">' + ZIP_STATES[state] + '</span>';
    });
  });

  /* ---------- Contact tabs (readable from ?path=) ---------- */
  var tablist = document.querySelector('[role="tablist"]');
  if (tablist) {
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
    var select = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () {
        select(t, false);
        try { history.replaceState(null, '', '?path=' + t.getAttribute('data-path')); } catch (err) { /* file:// */ }
      });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
    var path = null;
    try { path = new URLSearchParams(window.location.search).get('path'); } catch (err) { path = null; }
    var initial = tabs.filter(function (t) { return t.getAttribute('data-path') === path; })[0] || tabs[0];
    select(initial, false);
  }

  /* ---------- Footer year ---------- */
  var y = document.querySelector('[data-year]');
  if (y) y.textContent = String(new Date().getFullYear());

  root.classList.add('js-ready');
})();
