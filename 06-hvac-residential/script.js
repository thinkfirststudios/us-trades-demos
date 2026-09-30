/* Northvane Heating & Air — DEMO TEMPLATE 06 · ThinkFirst Studios
   Plain JS, no dependencies. Forms are client-side only: nothing is sent or stored. */
(function () {
  'use strict';
  var doc = document;
  var root = doc.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }

  /* ---------- Condensing header (84 → 58px, white → midnight) ---------- */
  var head = $('.site-head');
  var dots = $$('.hero__dots span');
  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset;
    // Hysteresis: the header shrinks by 26px, so a single threshold can make scroll anchoring
    // bounce the page between states. Condense past 90px, expand only back under 30px.
    if (head) {
      var c = head.classList.contains('is-condensed');
      if (!c && y > 90) head.classList.add('is-condensed');
      else if (c && y < 30) head.classList.remove('is-condensed');
    }
    if (dots.length) {
      var max = Math.max(1, doc.body.scrollHeight - window.innerHeight);
      var idx = Math.min(dots.length - 1, Math.floor((y / max) * dots.length));
      dots.forEach(function (d, i) { d.classList.toggle('is-on', i === idx); });
    }
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var menuBtn = $('.menu-btn');
  var mnav = $('#mnav');
  function setMenu(open) {
    if (!menuBtn || !mnav) return;
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    mnav.classList.toggle('is-open', open);
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') { setMenu(false); menuBtn.focus(); }
    });
    $$('#mnav a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  }

  /* ---------- Scroll reveal (12px rise, 50ms stagger via --i) ---------- */
  var reveals = $$('[data-reveal]');
  function showAll() { reveals.forEach(function (el) { el.classList.add('is-in'); }); }
  if (reduce || !('IntersectionObserver' in window)) {
    showAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Count-up (placeholder figures stay bracketed) ---------- */
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    if (isNaN(target)) return;
    if (reduce) { el.textContent = fmt(target) + suffix; return; }
    var start = null, dur = 800;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(target * eased)) + (p === 1 ? suffix : '');
      if (p < 1) window.requestAnimationFrame(step);
    }
    el.textContent = '0';
    window.requestAnimationFrame(step);
  }
  var counters = $$('[data-count]');
  if (counters.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      counters.forEach(function (el) { el.textContent = fmt(parseInt(el.getAttribute('data-count'), 10)) + (el.getAttribute('data-suffix') || ''); });
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { countUp(en.target); cio.unobserve(en.target); }
        });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { cio.observe(el); });
    }
  }

  /* ---------- Today's date on the availability card ---------- */
  $$('[data-today]').forEach(function (el) {
    try {
      var d = new Date();
      el.textContent = 'Today · ' + d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    } catch (e) { /* keep placeholder */ }
  });
  $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  /* ---------- Service-area ZIP check (demo list) ---------- */
  // [SERVICE AREA ZIPS — CONFIRM] Replace with the client's real ZIP list.
  var DEMO_ZIPS = ['12345', '12346', '12347', '12348', '12349'];
  var ICON_OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7"/></svg>';
  var ICON_NO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5.5M12 16.3v.2"/></svg>';
  $$('[data-zip]').forEach(function (form) {
    var input = $('input', form);
    var out = $('.zip__result', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = (input.value || '').replace(/\D/g, '');
      out.classList.remove('is-in', 'is-out');
      if (v.length !== 5) {
        input.setAttribute('aria-invalid', 'true');
        out.classList.add('is-out');
        out.innerHTML = ICON_NO + '<span>Enter a 5-digit ZIP code.</span>';
        input.focus();
        return;
      }
      input.removeAttribute('aria-invalid');
      if (DEMO_ZIPS.indexOf(v) > -1) {
        out.classList.add('is-in');
        out.innerHTML = ICON_OK + '<span>' + v + ' is inside the demo service area. Call or send a photo to book.</span>';
      } else {
        out.classList.add('is-out');
        out.innerHTML = ICON_NO + '<span>' + v + ' isn’t on the demo list. Call to check — the area may be wider [SERVICE AREA — CONFIRM].</span>';
      }
    });
    input.addEventListener('input', function () { input.value = input.value.replace(/\D/g, '').slice(0, 5); });
  });

  /* ---------- Seasonal split: Cooling / Heating ---------- */
  // [SEASONAL DEFAULT — demo logic] May–September opens on Cooling, October–April on Heating.
  // The client may want different months for their climate.
  var grid = $('.season__grid');
  if (grid) {
    var btns = $$('[data-season]');
    var cards = $$('[data-card]', grid);
    var mq = window.matchMedia('(min-width: 900px)');
    function apply(which) {
      grid.setAttribute('data-active', which);
      btns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-season') === which ? 'true' : 'false'); });
      cards.forEach(function (c) {
        var on = c.getAttribute('data-card') === which;
        c.classList.toggle('is-off', !on);
        if (on) c.removeAttribute('hidden'); else c.setAttribute('hidden', '');
      });
    }
    function swap(which) {
      if (grid.getAttribute('data-active') === which) return;
      if (reduce) { apply(which); return; }
      grid.classList.add('is-swapping');
      window.setTimeout(function () { apply(which); grid.classList.remove('is-swapping'); }, 200);
    }
    var m = new Date().getMonth(); // 0 = Jan
    apply(m >= 4 && m <= 8 ? 'cool' : 'heat');
    btns.forEach(function (b) { b.addEventListener('click', function () { swap(b.getAttribute('data-season')); }); });
    if (mq.addEventListener) mq.addEventListener('change', function () { apply(grid.getAttribute('data-active')); });
  }

  /* ---------- Shared form validation ---------- */
  function setErr(field, msg) {
    var err = doc.getElementById(field.id + '-err');
    if (msg) { field.setAttribute('aria-invalid', 'true'); if (err) err.textContent = msg; }
    else { field.removeAttribute('aria-invalid'); if (err) err.textContent = ''; }
    return !msg;
  }
  function validate(form) {
    var ok = true, first = null;
    $$('[required]', form).forEach(function (f) {
      var v = (f.value || '').trim(), msg = '';
      if (!v) msg = 'This field is required.';
      else if (f.type === 'tel' && v.replace(/\D/g, '').length < 10) msg = 'Enter a 10-digit phone number.';
      else if (f.name === 'zip' && !/^\d{5}$/.test(v)) msg = 'Enter a 5-digit ZIP.';
      if (!setErr(f, msg)) { ok = false; if (!first) first = f; }
    });
    if (first) first.focus();
    return ok;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function showDone(form, items) {
    var done = form.nextElementSibling;
    while (done && !done.hasAttribute('data-done')) done = done.nextElementSibling;
    if (!done) return;
    var list = $('[data-done-list]', done);
    if (list) list.innerHTML = items.map(function (t) { return '<li>' + t + '</li>'; }).join('');
    form.hidden = true;
    done.classList.add('is-shown');
    done.focus();
    var reset = $('[data-reset]', done);
    if (reset) reset.onclick = function () {
      form.reset();
      if (form._files) { form._files.length = 0; form._render(); }
      done.classList.remove('is-shown');
      form.hidden = false;
      var f = $('input, select', form); if (f) f.focus();
    };
  }
  doc.addEventListener('input', function (e) {
    var t = e.target;
    if (t.getAttribute && t.getAttribute('aria-invalid') === 'true') setErr(t, '');
  });

  /* ---------- Quote form with photo/video previews ---------- */
  var VID = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3.5" y="6.5" width="12" height="11" rx="1.5"/><path d="m15.5 10.5 5-3v9l-5-3"/></svg>';
  var XS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  $$('[data-quote]').forEach(function (form) {
    var input = $('input[type="file"]', form);
    var drop = $('[data-drop]', form);
    var chips = $('[data-chips]', form);
    var files = [];
    var urls = [];
    form._files = files;
    function render() {
      urls.forEach(function (u) { try { URL.revokeObjectURL(u); } catch (e) {} });
      urls = [];
      chips.innerHTML = '';
      files.forEach(function (f, i) {
        var li = doc.createElement('li');
        li.className = 'chip';
        var thumb;
        if (/^image\//.test(f.type)) {
          var u = URL.createObjectURL(f); urls.push(u);
          thumb = '<img src="' + u + '" alt="">';
        } else {
          thumb = '<span class="chip__vid">' + VID + '</span>';
        }
        li.innerHTML = thumb + '<span class="chip__name" title="' + esc(f.name) + '">' + esc(f.name) + '</span>' +
          '<button type="button" aria-label="Remove ' + esc(f.name) + '">' + XS + '</button>';
        $('button', li).addEventListener('click', function () {
          files.splice(i, 1); render();
          (input || form).focus();
        });
        chips.appendChild(li);
      });
    }
    form._render = render;
    function add(list) {
      Array.prototype.forEach.call(list || [], function (f) {
        if (/^(image|video)\//.test(f.type) && files.length < 8) files.push(f);
      });
      render();
    }
    if (input) input.addEventListener('change', function () { add(input.files); input.value = ''; });
    if (drop) {
      ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
      ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('is-over'); }); });
      drop.addEventListener('drop', function (e) { if (e.dataTransfer) add(e.dataTransfer.files); });
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(form)) return;
      var fd = new FormData(form);
      showDone(form, [
        'Name: ' + esc(fd.get('name')),
        'Problem: ' + esc(fd.get('problem')),
        'ZIP: ' + esc(fd.get('zip')),
        'Attachments: ' + files.length + (files.length ? ' (previewed in your browser only)' : '')
      ]);
    });
  });

  /* ---------- Plan sign-up ---------- */
  $$('[data-plan]').forEach(function (form) {
    var sel = $('#pl-tier', form);
    $$('[data-tier]').forEach(function (a) {
      a.addEventListener('click', function () { if (sel) sel.value = a.getAttribute('data-tier'); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(form)) return;
      var fd = new FormData(form);
      showDone(form, ['Name: ' + esc(fd.get('name')), 'Plan: ' + esc(fd.get('tier')), 'System age: ' + esc(fd.get('age')), 'Payment: not taken (demo)']);
    });
  });
})();
