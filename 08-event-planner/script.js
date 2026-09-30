/* Foxglove & Fold — demo template (08). Fictional business, ThinkFirst Studios.
   Plain JS, no dependencies. Every form is client-side only: nothing is sent anywhere. */
(function () {
  'use strict';
  window.FF_READY = true;

  var d = document;
  var root = d.documentElement;
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var $ = function (sel, ctx) { return (ctx || d).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || d).querySelectorAll(sel)); };
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var params = new URLSearchParams(window.location.search);

  function el(tag, cls, text) {
    var n = d.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function ph(text) { return el('span', 'ph', '[' + text + ']'); }

  /* ---------- condensing sticky nav strip ---------- */
  var strip = $('.navstrip');
  var ticking = false;
  function onScroll() {
    ticking = false;
    if (!strip) return;
    var stuck = strip.getBoundingClientRect().top <= 0 && window.scrollY > 40;
    strip.classList.toggle('is-stuck', stuck);
    var mark = $('.ns-mark', strip);
    if (mark) {
      if (stuck) { mark.removeAttribute('tabindex'); mark.removeAttribute('aria-hidden'); }
      else { mark.setAttribute('tabindex', '-1'); mark.setAttribute('aria-hidden', 'true'); }
    }
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  var menuBtn = $('.ns-menu');
  var panel = $('#mnav');
  if (menuBtn && panel) {
    var closeBtn = $('.mnav-close', panel);
    var openMenu = function () {
      panel.classList.add('is-open');
      menuBtn.setAttribute('aria-expanded', 'true');
      d.body.classList.add('menu-open');
      window.setTimeout(function () { closeBtn.focus(); }, 30);
    };
    var closeMenu = function (restore) {
      if (!panel.classList.contains('is-open')) return;
      panel.classList.remove('is-open');
      menuBtn.setAttribute('aria-expanded', 'false');
      d.body.classList.remove('menu-open');
      if (restore !== false) menuBtn.focus();
    };
    menuBtn.addEventListener('click', openMenu);
    closeBtn.addEventListener('click', function () { closeMenu(); });
    $$('a', panel).forEach(function (a) { a.addEventListener('click', function () { closeMenu(false); }); });
    d.addEventListener('keydown', function (e) {
      if (!panel.classList.contains('is-open')) return;
      if (e.key === 'Escape') { closeMenu(); return; }
      if (e.key === 'Tab') {
        var f = $$('a, button', panel);
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    window.addEventListener('resize', function () { if (window.innerWidth >= 900) closeMenu(false); });
  }

  /* ---------- scroll reveal (24px rise + fade, 520ms, 90ms stagger, once) ---------- */
  $$('[data-stagger]').forEach(function (group) {
    var i = 0;
    Array.prototype.forEach.call(group.children, function (c) {
      if (c.classList.contains('reveal')) { c.style.setProperty('--i', String(i % 6)); i++; }
    });
  });
  var reveals = $$('.reveal');
  var revealOn = root.classList.contains('js-reveal') && 'IntersectionObserver' in window;
  if (revealOn) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -3% 0px' });
    reveals.forEach(function (r) { io.observe(r); });
  } else {
    reveals.forEach(function (r) { r.classList.add('is-in'); });
  }

  /* ---------- hero photographs drift apart on load ---------- */
  var hero = $('.hero');
  if (hero) {
    if (reduce) hero.classList.add('is-settled');
    else window.requestAnimationFrame(function () { window.setTimeout(function () { hero.classList.add('is-settled'); }, 120); });
  }

  /* ---------- count-ups (About figures) — brackets retained ---------- */
  function fmt(n, suffix) { return '[' + n + (suffix || '') + ']'; }
  function countUp(node) {
    var to = parseInt(node.getAttribute('data-count'), 10);
    var suffix = node.getAttribute('data-suffix') || '';
    if (reduce || !isFinite(to)) { node.textContent = fmt(to, suffix); return; }
    var start = null, dur = 1200;
    node.textContent = fmt(0, suffix);
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      node.textContent = fmt(Math.round(to * eased), suffix);
      if (p < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }
  var counters = $$('[data-count]');
  if (counters.length) {
    if ('IntersectionObserver' in window && !reduce) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { countUp(en.target); cio.unobserve(en.target); }
        });
      }, { threshold: 0.4 });
      counters.forEach(function (c) { cio.observe(c); });
    }
    /* reduced motion / no IO: markup already shows the final bracketed value */
  }

  /* ---------- availability checker (demo states) ---------- */
  function monthKey(y, m) { return y + '-' + (m < 9 ? '0' : '') + (m + 1); }
  function monthLabel(y, m) { return MONTHS[m] + ' ' + y; }
  /* Demo rule set — replace with the studio's live calendar:
     inside the booking window (next 3 months) -> [DATE POLICY — CONFIRM]
     peak months (May, June, September, October) -> Enquire — limited
     everything else -> Available */
  function stateFor(m, ahead) {
    if (ahead < 3) return 'policy';
    if ([4, 5, 8, 9].indexOf(m) > -1) return 'limited';
    return 'available';
  }
  var STATE_TEXT = {
    available: { label: 'Available', body: 'This month is open in the demo calendar. Send your preferred date and the studio will confirm it in writing.' },
    limited: { label: 'Enquire — limited', body: 'A peak month. A small number of dates may remain — include a preferred date and a flexible alternative.' },
    policy: { label: null, body: 'This month falls inside the studio’s booking window, so the short-notice policy applies.' }
  };

  $$('[data-avail]').forEach(function (widget) {
    var grid = $('.months', widget);
    var result = $('.avail-result', widget);
    var local = widget.hasAttribute('data-local');
    var ns = $('[data-noscript]', grid);
    if (ns) ns.remove();
    var now = new Date();
    var y0 = now.getFullYear(), m0 = now.getMonth();
    var lastYear = null;
    var buttons = [];
    for (var i = 0; i < 18; i++) {
      var y = y0 + Math.floor((m0 + i) / 12);
      var m = (m0 + i) % 12;
      if (y !== lastYear) {
        var yr = el('p', 'picker-year', String(y));
        yr.setAttribute('aria-hidden', 'true');
        grid.appendChild(yr);
        lastYear = y;
      }
      var b = el('button', 'month', MONTHS[m].slice(0, 3));
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-label', monthLabel(y, m));
      b.dataset.y = y; b.dataset.m = m; b.dataset.ahead = i;
      grid.appendChild(b);
      buttons.push(b);
    }
    function render(btn) {
      buttons.forEach(function (x) { x.setAttribute('aria-pressed', x === btn ? 'true' : 'false'); });
      var y = +btn.dataset.y, m = +btn.dataset.m, st = stateFor(m, +btn.dataset.ahead);
      var info = STATE_TEXT[st];
      result.textContent = '';
      var s = el('p', 'res-state st-' + st);
      var mark = el('span', 'st-mark'); mark.setAttribute('aria-hidden', 'true');
      s.appendChild(mark);
      if (info.label) s.appendChild(d.createTextNode(info.label));
      else s.appendChild(ph('DATE POLICY — CONFIRM'));
      result.appendChild(s);
      result.appendChild(el('h4', null, monthLabel(y, m)));
      result.appendChild(el('p', null, info.body));
      if (local) {
        var use = el('button', 'btn', 'Use ' + monthLabel(y, m) + ' in the form');
        use.type = 'button';
        use.addEventListener('click', function () { applyMonth(y, m, st, true); });
        result.appendChild(use);
      } else {
        var a = el('a', 'btn btn--solid', 'Enquire for ' + monthLabel(y, m));
        a.href = 'enquire.html?month=' + monthKey(y, m);
        result.appendChild(a);
      }
    }
    grid.addEventListener('click', function (e) {
      var btn = e.target.closest('.month');
      if (btn) render(btn);
    });
    /* arrow-key movement between months */
    grid.addEventListener('keydown', function (e) {
      var idx = buttons.indexOf(d.activeElement);
      if (idx < 0) return;
      var next = null;
      if (e.key === 'ArrowRight') next = buttons[idx + 1];
      if (e.key === 'ArrowLeft') next = buttons[idx - 1];
      if (next) { e.preventDefault(); next.focus(); }
    });
    widget._select = function (key) {
      var hit = buttons.filter(function (b) { return monthKey(+b.dataset.y, +b.dataset.m) === key; })[0];
      if (hit) render(hit);
      return hit;
    };
  });

  /* ---------- forms: shared helpers ---------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function setErr(input, errEl, msg) {
    if (errEl) errEl.textContent = msg || '';
    if (input) {
      if (msg) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }
    return !msg;
  }
  function optText(sel) { return sel && sel.selectedIndex > 0 ? sel.options[sel.selectedIndex].text : ''; }
  function niceDate(v) {
    if (!v) return '';
    var p = v.split('-');
    if (p.length !== 3) return v;
    return MONTHS[+p[1] - 1] + ' ' + (+p[2]) + ', ' + p[0];
  }
  function todayISO() {
    var t = new Date();
    return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
  }
  function showDone(form, done, title, rows, extra) {
    done.textContent = '';
    done.appendChild(el('span', 'badge', 'Demo — nothing was sent'));
    done.appendChild(el('h3', null, title));
    var p = el('p');
    p.appendChild(d.createTextNode('On the live site this enquiry would go to the studio through '));
    p.appendChild(ph('FORM HANDLER — CONFIRM'));
    p.appendChild(d.createTextNode('. Reply expectation: '));
    p.appendChild(ph('RESPONSE EXPECTATION — CONFIRM'));
    p.appendChild(d.createTextNode('.'));
    done.appendChild(p);
    var ul = el('ul', 'summary');
    rows.forEach(function (r) {
      if (!r[1]) return;
      var li = el('li');
      li.appendChild(el('b', null, r[0]));
      li.appendChild(el('span', null, r[1]));
      ul.appendChild(li);
    });
    done.appendChild(ul);
    if (extra) done.appendChild(extra);
    var again = el('button', 'btn', 'Start again');
    again.type = 'button';
    again.addEventListener('click', function () {
      form.reset();
      form.hidden = false;
      done.hidden = true;
      var first = form.querySelector('input, select, textarea');
      if (first) first.focus();
      form.dispatchEvent(new Event('ff-reset'));
    });
    done.appendChild(again);
    form.hidden = true;
    done.hidden = false;
    done.focus();
  }

  /* ---------- quick enquiry band ---------- */
  var qe = $('#qe');
  if (qe) {
    var qeFull = $('#qe-full');
    var qName = $('#qe-name', qe), qEmail = $('#qe-email', qe), qDate = $('#qe-date', qe),
        qType = $('#qe-type', qe), qHead = $('#qe-head', qe), qBud = $('#qe-budget', qe);
    qDate.min = todayISO();
    /* carry anything typed into the full form link */
    var syncLink = function () {
      if (!qeFull) return;
      var p = new URLSearchParams();
      if (qName.value.trim()) p.set('name', qName.value.trim());
      if (qEmail.value.trim()) p.set('email', qEmail.value.trim());
      if (qDate.value) p.set('date', qDate.value);
      if (qType.value) p.set('type', qType.value);
      if (qHead.selectedIndex > 0) p.set('headcount', String(qHead.selectedIndex));
      if (qBud.selectedIndex > 0) p.set('budget', String(qBud.selectedIndex));
      var s = p.toString();
      qeFull.href = 'enquire.html' + (s ? '?' + s : '');
    };
    qe.addEventListener('input', syncLink);
    qe.addEventListener('change', syncLink);
    qe.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true, firstBad = null;
      if (!setErr(qName, $('#qe-name-err'), qName.value.trim() ? '' : 'Please add your name.')) { ok = false; firstBad = firstBad || qName; }
      var ev = qEmail.value.trim();
      var em = !ev ? 'Please add an email so the studio can reply.' : (!EMAIL_RE.test(ev) ? 'That email doesn’t look complete.' : '');
      if (!setErr(qEmail, $('#qe-email-err'), em)) { ok = false; firstBad = firstBad || qEmail; }
      if (!ok) { firstBad.focus(); return; }
      var cont = el('p');
      var link = el('a', 'textlink', 'Add the rest in the full enquiry form →');
      syncLink();
      link.href = qeFull ? qeFull.getAttribute('href') : 'enquire.html';
      cont.appendChild(link);
      showDone(qe, $('#qe-done'), 'Thank you, ' + qName.value.trim().split(' ')[0] + '.', [
        ['Email', ev], ['Date', niceDate(qDate.value) || 'Not set yet'], ['Event', optText(qType)],
        ['Guests', optText(qHead)], ['Budget', optText(qBud)]
      ], cont);
    });
  }

  /* ---------- full enquiry form ---------- */
  var ef = $('#ef');
  var applyMonth = function () {};
  if (ef) {
    var f = {
      name: $('#ef-name'), email: $('#ef-email'), phone: $('#ef-phone'), date: $('#ef-date'), flex: $('#ef-flex'),
      head: $('#ef-head'), venue: $('#ef-venue'), novenue: $('#ef-novenue'), budget: $('#ef-budget'),
      pkg: $('#ef-package'), about: $('#ef-about'), found: $('#ef-found'), consent: $('#ef-consent')
    };
    var dateHint = $('#ef-date-hint');
    var defaultHint = dateHint.textContent;
    var ctx = $('#ef-context');
    f.date.min = todayISO();

    var syncFlex = function () {
      f.date.disabled = f.flex.checked;
      f.date.required = !f.flex.checked;
      if (f.flex.checked) setErr(f.date, $('#ef-date-err'), '');
    };
    var syncVenue = function () {
      f.venue.disabled = f.novenue.checked;
      if (f.novenue.checked) f.venue.value = '';
    };
    f.flex.addEventListener('change', syncFlex);
    f.novenue.addEventListener('change', syncVenue);

    applyMonth = function (y, m, st, focus) {
      var first = y + '-' + String(m + 1).padStart(2, '0') + '-01';
      var lastDay = new Date(y, m + 1, 0).getDate();
      var last = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(lastDay).padStart(2, '0');
      f.date.min = first < todayISO() ? todayISO() : first;
      f.date.max = last;
      if (f.date.value && (f.date.value < f.date.min || f.date.value > last)) f.date.value = '';
      f.flex.checked = false; syncFlex();
      var label = st === 'limited' ? 'Enquire — limited' : st === 'available' ? 'Available' : 'date policy applies';
      dateHint.textContent = 'You checked ' + MONTHS[m] + ' ' + y + ' (' + label + ', demo). Pick a day in that month, or tick “I’m flexible”.';
      if (focus) { f.date.focus(); f.date.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); }
    };

    /* pre-fill from query string: package / type / month / ref / quick-form values */
    var pkg = params.get('package');
    if (pkg && ['day-of', 'partial', 'full'].indexOf(pkg) > -1) f.pkg.value = pkg;
    var typ = params.get('type');
    if (typ) { var r = ef.querySelector('input[name="type"][value="' + typ.replace(/[^a-z]/g, '') + '"]'); if (r) r.checked = true; }
    if (params.get('name')) f.name.value = params.get('name');
    if (params.get('email')) f.email.value = params.get('email');
    if (params.get('date') && /^\d{4}-\d{2}-\d{2}$/.test(params.get('date'))) f.date.value = params.get('date');
    var hi = parseInt(params.get('headcount'), 10); if (hi > 0 && hi < f.head.options.length) f.head.selectedIndex = hi;
    var bi = parseInt(params.get('budget'), 10); if (bi > 0 && bi < f.budget.options.length) f.budget.selectedIndex = bi;
    var notes = [];
    if (pkg && f.pkg.value === pkg) notes.push('Package pre-filled from the tier you chose — change it any time.');
    var ref = params.get('ref');
    if (ref) {
      ref = ref.slice(0, 80);
      notes.push('Enquiring after viewing “' + ref + '”.');
      if (!f.about.value) f.about.value = 'We saw “' + ref + '” in your portfolio and would like something in that spirit.\n\n';
    }
    if (params.get('name') || params.get('email')) notes.push('Details carried over from the quick enquiry.');
    if (notes.length) { ctx.textContent = notes.join(' '); ctx.hidden = false; }
    var mon = params.get('month');
    var widget = $('[data-avail][data-local]');
    if (mon && /^\d{4}-\d{2}$/.test(mon)) {
      var my = +mon.slice(0, 4), mm = +mon.slice(5, 7) - 1;
      var hitBtn = widget && widget._select ? widget._select(mon) : null;
      var st = hitBtn ? stateFor(mm, +hitBtn.dataset.ahead) : 'available';
      if (mm >= 0 && mm < 12) applyMonth(my, mm, st, false);
    }

    ef.addEventListener('ff-reset', function () {
      syncFlex(); syncVenue();
      dateHint.textContent = defaultHint;
      f.date.removeAttribute('max'); f.date.min = todayISO();
      $$('.err', ef).forEach(function (e) { e.textContent = ''; });
      $$('[aria-invalid]', ef).forEach(function (e) { e.removeAttribute('aria-invalid'); });
    });

    ef.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = [];
      var chk = function (cond, input, errId, msg) {
        var okk = setErr(input, $(errId), cond ? '' : msg);
        if (!okk) bad.push(input);
      };
      chk(!!f.name.value.trim(), f.name, '#ef-name-err', 'Please add your name.');
      var ev = f.email.value.trim();
      if (!ev) chk(false, f.email, '#ef-email-err', 'Please add an email so the studio can reply.');
      else chk(EMAIL_RE.test(ev), f.email, '#ef-email-err', 'That email doesn’t look complete.');
      if (!f.flex.checked) {
        if (!f.date.value) chk(false, f.date, '#ef-date-err', 'Choose a date, or tick “I’m flexible”.');
        else chk(!(f.date.min && f.date.value < f.date.min) && !(f.date.max && f.date.value > f.date.max), f.date, '#ef-date-err', 'Choose a date within the range shown, or tick “I’m flexible”.');
      }
      var typeSel = ef.querySelector('input[name="type"]:checked');
      var chips = $('#ef-type');
      if (!typeSel) { chips.setAttribute('aria-invalid', 'true'); $('#ef-type-err').textContent = 'Choose the kind of event.'; bad.push(chips.querySelector('input')); }
      else { chips.removeAttribute('aria-invalid'); $('#ef-type-err').textContent = ''; }
      chk(f.head.selectedIndex > 0, f.head, '#ef-head-err', 'Choose a headcount band — “Not sure yet” is fine.');
      chk(f.budget.selectedIndex > 0, f.budget, '#ef-budget-err', 'Choose a budget band — “Not sure yet” is fine.');
      chk(f.consent.checked, f.consent, '#ef-consent-err', 'Please confirm the studio may use these details to reply.');
      if (bad.length) { bad[0].focus(); return; }
      var typeLbl = typeSel.parentNode.textContent.trim();
      showDone(ef, $('#ef-done'), 'Thank you, ' + f.name.value.trim().split(' ')[0] + ' — your enquiry is ready.', [
        ['Name', f.name.value.trim()], ['Email', ev], ['Phone', f.phone.value.trim()],
        ['Date', f.flex.checked ? 'Flexible / not set' : niceDate(f.date.value)], ['Event', typeLbl],
        ['Guests', optText(f.head)], ['Venue', f.novenue.checked ? 'Not booked yet' : f.venue.value.trim()],
        ['Budget', optText(f.budget)], ['Package', f.pkg.options[f.pkg.selectedIndex].text],
        ['Found us', optText(f.found)]
      ]);
      if (ctx) ctx.hidden = true;
      window.scrollTo({ top: $('#ef-done').getBoundingClientRect().top + window.scrollY - 90, behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  /* ---------- portfolio filter + load more ---------- */
  var fgrid = $('[data-filter-grid]');
  if (fgrid) {
    var tiles = $$('.tile', fgrid);
    var fbtns = $$('[data-filter]');
    var more = $('[data-more]');
    var out = $('[data-count-out]');
    var current = 'all', expanded = false;
    var apply = function () {
      var shown = 0, total = 0, hiddenExtra = 0;
      tiles.forEach(function (t) {
        var match = current === 'all' || t.dataset.cat === current;
        if (match) total++;
        var extra = t.hasAttribute('data-extra');
        var show = match && (expanded || !extra);
        if (match && extra && !expanded) hiddenExtra++;
        t.hidden = !show;
        if (show) { shown++; if (!revealOn) t.classList.add('is-in'); }
      });
      if (out) out.textContent = 'Showing ' + shown + ' of ' + total + ' events';
      if (more) more.hidden = hiddenExtra === 0;
    };
    fbtns.forEach(function (b) {
      b.addEventListener('click', function () {
        current = b.dataset.filter;
        fbtns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        apply();
      });
    });
    if (more) more.addEventListener('click', function () {
      var firstNew = tiles.filter(function (t) { return t.hidden && t.hasAttribute('data-extra') && (current === 'all' || t.dataset.cat === current); })[0];
      expanded = true; apply();
      if (firstNew) firstNew.focus();
    });
    apply();
  }
})();
