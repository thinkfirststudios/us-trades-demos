/* Cornerpost Property Services — DEMO TEMPLATE 02 · ThinkFirst Studios
   Plain JS, no dependencies. Motion is precise and administrative:
   160–220ms, cubic-bezier(.4,0,.2,1), 10px slides, nothing continuous. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- Header condense past 60px ---------- */
  var header = document.querySelector('.site-header');
  if (header) {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        header.classList.toggle('is-condensed', window.scrollY > 60);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobile drawer ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  var drawer = document.getElementById('drawer');
  if (menuBtn && drawer) {
    var closeBtn = drawer.querySelector('.drawer-close');
    var lastFocus = null;
    var focusables = function () {
      return Array.prototype.slice.call(drawer.querySelectorAll('a[href], button:not([disabled])'));
    };
    var openDrawer = function () {
      lastFocus = document.activeElement;
      drawer.classList.add('is-open');
      drawer.removeAttribute('inert');
      drawer.setAttribute('aria-hidden', 'false');
      menuBtn.setAttribute('aria-expanded', 'true');
      document.body.classList.add('drawer-open');
      var f = focusables();
      if (f.length) f[0].focus();
    };
    var closeDrawer = function () {
      drawer.classList.remove('is-open');
      drawer.setAttribute('inert', '');
      drawer.setAttribute('aria-hidden', 'true');
      menuBtn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('drawer-open');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };
    menuBtn.addEventListener('click', openDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    drawer.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (a) closeDrawer();
    });
    document.addEventListener('keydown', function (e) {
      if (!drawer.classList.contains('is-open')) return;
      if (e.key === 'Escape') { closeDrawer(); return; }
      if (e.key === 'Tab') {
        var f = focusables();
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1200 && drawer.classList.contains('is-open')) closeDrawer();
    });
  }

  /* ---------- Scroll reveal (10px + fade, 200ms, 60ms stagger, once) ---------- */
  var revealAll = function () {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-in'); });
    document.querySelectorAll('.tbl-anim').forEach(function (el) { el.classList.add('is-in'); });
  };

  // stagger groups: children of [data-stagger] get --d
  document.querySelectorAll('[data-stagger]').forEach(function (group) {
    var step = parseInt(group.getAttribute('data-stagger'), 10) || 60;
    Array.prototype.forEach.call(group.querySelectorAll(':scope > .reveal'), function (el, i) {
      el.style.setProperty('--d', (reduce ? 0 : i * step) + 'ms');
    });
  });
  // table rows: 40ms stagger
  document.querySelectorAll('.tbl-anim tbody tr').forEach(function (tr, i, all) {
    var idx = Array.prototype.indexOf.call(tr.parentNode.children, tr);
    tr.style.transitionDelay = reduce ? '0ms' : (idx * 40) + 'ms';
  });

  if (reduce || !hasIO) {
    revealAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    document.querySelectorAll('.reveal, .tbl-anim').forEach(function (el) { io.observe(el); });
    // Safety sweep: fast scrolls / anchor jumps can skip an observer frame. Anything at or
    // above the viewport bottom is revealed, so content is never left invisible.
    var sweepPending = false;
    var sweep = function () {
      sweepPending = false;
      var limit = (window.innerHeight || 800) * 0.98;
      document.querySelectorAll('.reveal:not(.is-in), .tbl-anim:not(.is-in)').forEach(function (el) {
        if (el.getBoundingClientRect().top < limit) { el.classList.add('is-in'); io.unobserve(el); }
      });
    };
    window.addEventListener('scroll', function () {
      if (!sweepPending) { sweepPending = true; window.setTimeout(function () { window.requestAnimationFrame(sweep); }, 180); }
    }, { passive: true });
    window.addEventListener('load', sweep);
    window.addEventListener('hashchange', sweep);
    // Safety net: anything already scrolled past (anchor jumps, print) is shown.
    window.addEventListener('beforeprint', revealAll);
  }

  /* ---------- Count-up (800ms; brackets static, digits animate) ---------- */
  var fmt = function (n, useComma) {
    var s = String(Math.round(n));
    return useComma ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : s;
  };
  var runCount = function (el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var comma = el.getAttribute('data-comma') === '1';
    if (isNaN(target)) return;
    if (reduce) { el.textContent = fmt(target, comma); return; }
    var start = null, dur = 800;
    var tick = function (t) {
      if (start === null) start = t;
      var p = Math.min(1, (t - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased, comma);
      if (p < 1) window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);
  };
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    if (!hasIO || reduce) {
      counters.forEach(function (el) { el.textContent = fmt(parseFloat(el.getAttribute('data-count')), el.getAttribute('data-comma') === '1'); });
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { runCount(entry.target); cio.unobserve(entry.target); }
        });
      }, { threshold: 0.4 });
      counters.forEach(function (el) {
        el.setAttribute('data-final', el.textContent);
        el.textContent = '0';
        cio.observe(el);
      });
    }
  }

  /* ---------- Priority segmented control (brass underline slides) ---------- */
  document.querySelectorAll('.seg').forEach(function (seg) {
    var inputs = seg.querySelectorAll('input[type=radio]');
    var sync = function () {
      Array.prototype.forEach.call(inputs, function (inp, i) { if (inp.checked) seg.setAttribute('data-i', String(i)); });
      var hint = seg.querySelector('.seg__hint');
      var checked = seg.querySelector('input:checked');
      if (hint && checked && checked.getAttribute('data-hint')) hint.textContent = checked.getAttribute('data-hint');
    };
    Array.prototype.forEach.call(inputs, function (inp) { inp.addEventListener('change', sync); });
    sync();
  });

  /* ---------- Photo drop zones (multi-file, client-side preview only) ---------- */
  document.querySelectorAll('.drop').forEach(function (zone) {
    var input = zone.querySelector('input[type=file]');
    var list = zone.parentNode.querySelector('.files');
    if (!input) return;
    ['dragenter', 'dragover'].forEach(function (ev) {
      zone.addEventListener(ev, function () { zone.classList.add('is-over'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      zone.addEventListener(ev, function () { zone.classList.remove('is-over'); });
    });
    input.addEventListener('change', function () {
      if (!list) return;
      list.innerHTML = '';
      Array.prototype.slice.call(input.files || [], 0, 12).forEach(function (file) {
        var li = document.createElement('li');
        if (/^image\//.test(file.type) && window.URL && URL.createObjectURL) {
          var img = document.createElement('img');
          img.alt = 'Selected photo: ' + file.name;
          img.src = URL.createObjectURL(file);
          img.onload = function () { URL.revokeObjectURL(img.src); };
          li.appendChild(img);
        }
        var span = document.createElement('span');
        span.textContent = file.name;
        li.appendChild(span);
        list.appendChild(li);
      });
      var count = zone.querySelector('.drop__count');
      if (count) count.textContent = (input.files && input.files.length) ? input.files.length + ' file(s) attached — demo only, nothing uploads' : '';
    });
  });

  /* ---------- Forms: inline validation + demo confirmation ---------- */
  var validators = {
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); },
    tel: function (v) { return v.replace(/\D/g, '').length >= 10; }
  };
  var checkField = function (el) {
    var field = el.closest('.field');
    if (!field) return true;
    var v = (el.value || '').trim();
    var ok = true;
    if (el.required && !v) ok = false;
    else if (v && el.type === 'email') ok = validators.email(v);
    else if (v && el.type === 'tel') ok = validators.tel(v);
    field.classList.toggle('is-invalid', !ok);
    el.setAttribute('aria-invalid', ok ? 'false' : 'true');
    return ok;
  };

  document.querySelectorAll('form[data-demo-form]').forEach(function (form) {
    var fields = form.querySelectorAll('input:not([type=radio]):not([type=file]), select, textarea');
    fields.forEach(function (el) {
      el.addEventListener('blur', function () { if (el.value || el.getAttribute('aria-invalid') === 'true') checkField(el); });
      el.addEventListener('input', function () { if (el.getAttribute('aria-invalid') === 'true') checkField(el); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      fields.forEach(function (el) { if (!checkField(el) && !firstBad) firstBad = el; });
      if (firstBad) { firstBad.focus(); return; }
      var shell = form.closest('[data-form-shell]') || form;
      // Fill the mock confirmation summary
      var pri = form.querySelector('input[type=radio]:checked');
      var prop = form.querySelector('[name=property]');
      var cat = form.querySelector('[name=category]');
      var setText = function (sel, val) { var n = shell.querySelector(sel); if (n) n.textContent = val; };
      if (pri) setText('[data-out=priority]', pri.getAttribute('data-label') || pri.value);
      if (prop && prop.value) setText('[data-out=property]', prop.value);
      if (cat && cat.value) setText('[data-out=category]', cat.options ? cat.options[cat.selectedIndex].text : cat.value);
      shell.classList.add('is-sent');
      var conf = shell.querySelector('.confirm');
      if (conf) { conf.setAttribute('tabindex', '-1'); conf.focus(); }
    });
    var reset = (form.closest('[data-form-shell]') || form).querySelector('[data-reset]');
    if (reset) {
      reset.addEventListener('click', function () {
        var shell = form.closest('[data-form-shell]') || form;
        form.reset();
        shell.classList.remove('is-sent');
        form.querySelectorAll('.files').forEach(function (l) { l.innerHTML = ''; });
        form.querySelectorAll('.seg').forEach(function (s) { s.setAttribute('data-i', '0'); });
        var f = form.querySelector('input, select, textarea');
        if (f) f.focus();
      });
    }
  });

  /* ---------- Work-order lifecycle: ticket advances with scroll progress ---------- */
  document.querySelectorAll('.rail').forEach(function (rail) {
    var steps = rail.querySelectorAll('.rail__step');
    var trav = rail.querySelector('.rail-traveller');
    if (reduce || !steps.length) {
      steps.forEach(function (s) { s.classList.add('is-done'); });
      return;
    }
    rail.classList.add('rail--live');
    var n = steps.length;
    var set = function (idx) {
      steps.forEach(function (s, i) {
        s.classList.toggle('is-active', i === idx);
        s.classList.toggle('is-done', i < idx);
      });
      if (trav) {
        trav.style.setProperty('--step', idx);
        var lbl = trav.querySelector('[data-stage]');
        var stage = steps[idx].getAttribute('data-stage');
        if (lbl && stage) lbl.textContent = stage;
      }
    };
    var pending = false;
    var update = function () {
      pending = false;
      var r = rail.getBoundingClientRect();
      var vh = window.innerHeight || 800;
      // progress 0 when rail top hits 80% of viewport, 1 when rail top reaches 25%
      var p = (vh * 0.8 - r.top) / (vh * 0.55);
      p = Math.max(0, Math.min(0.999, p));
      set(Math.floor(p * n));
    };
    var req = function () { if (!pending) { pending = true; window.requestAnimationFrame(update); } };
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', req);
    update();
  });

  /* ---------- Accordion beside swapping photo ---------- */
  document.querySelectorAll('[data-acc]').forEach(function (acc) {
    var btns = acc.querySelectorAll('.acc__btn');
    var photos = document.querySelectorAll('[data-acc-photo] .grade');
    var show = function (idx) {
      btns.forEach(function (b, i) {
        var open = i === idx;
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
        var panel = document.getElementById(b.getAttribute('aria-controls'));
        if (panel) panel.hidden = !open;
      });
      photos.forEach(function (p, i) { p.classList.toggle('is-shown', i === idx); });
    };
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () {
        var isOpen = b.getAttribute('aria-expanded') === 'true';
        if (isOpen) {
          b.setAttribute('aria-expanded', 'false');
          var panel = document.getElementById(b.getAttribute('aria-controls'));
          if (panel) panel.hidden = true;
        } else {
          show(i);
        }
      });
    });
  });

  /* ---------- Year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
})();
