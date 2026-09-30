/* Lanternwood Pet Lodge — fictional demo template (ThinkFirst Studios).
   Plain JS, no framework. All figures in [brackets] are placeholders.
   Everything here is client-side only: no data leaves the browser. */
(function () {
  "use strict";
  window.__lwReady = true;

  var doc = document;
  var root = doc.documentElement;
  var reduceMQ = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  function reduced() { return !!reduceMQ.matches; }
  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function store(key, val) {
    try {
      if (val === undefined) { var v = window.localStorage.getItem(key); return v ? JSON.parse(v) : null; }
      if (val === null) { window.localStorage.removeItem(key); return null; }
      window.localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { return null; }
    return null;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function ph(s) { return '<span class="ph">' + esc(s) + "</span>"; }
  function money(n) { return ph("$[" + Math.round(n).toLocaleString("en-US") + "]"); }

  /* ---------------- Header ---------------- */
  var header = $(".site-header");
  function onScroll() { if (header) header.classList.toggle("is-condensed", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var toggle = $(".menu-toggle");
  var mnav = $("#mobile-nav");
  if (toggle && mnav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Open menu" : "Close menu");
      mnav.hidden = open;
    });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        toggle.click(); toggle.focus();
      }
    });
  }

  /* ---------------- Reveal with stagger ---------------- */
  $$("[data-stagger]").forEach(function (group) {
    $$("[data-reveal]", group).forEach(function (el, i) { el.style.setProperty("--d", Math.min(i, 8) * 90 + "ms"); });
  });
  var revealEls = $$("[data-reveal]");
  function showAll() { revealEls.forEach(function (el) { el.classList.add("is-in"); }); }
  if ("IntersectionObserver" in window && root.classList.contains("js-reveal")) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
    // timed fallback: anything still hidden after 6s is shown
    setTimeout(showAll, 6000);
  } else {
    root.classList.remove("js-reveal");
    showAll();
  }

  /* ---------------- Count-up ---------------- */
  var counters = $$("[data-count]");
  function runCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var prefix = el.getAttribute("data-prefix") || "";
    var fmt = function (n) { return prefix + Math.round(n).toLocaleString("en-US") + suffix; };
    if (reduced() || isNaN(target)) { el.textContent = fmt(target); return; }
    var start = null, dur = 1400;
    function step(ts) {
      if (!start) start = ts;
      var t = Math.min(1, (ts - start) / dur);
      var e = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt(target * e);
      if (t < 1) requestAnimationFrame(step); else el.textContent = fmt(target);
    }
    requestAnimationFrame(step);
  }
  if (counters.length) {
    if ("IntersectionObserver" in window && !reduced()) {
      counters.forEach(function (el) { el.textContent = (el.getAttribute("data-prefix") || "") + "0" + (el.getAttribute("data-suffix") || ""); });
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { runCount(en.target); cio.unobserve(en.target); } });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { cio.observe(el); });
    } else { counters.forEach(runCount); }
  }

  /* ---------------- Timeline line draw ---------------- */
  $$(".timeline-wrap").forEach(function (tl) {
    if (reduced() || !("IntersectionObserver" in window)) { tl.classList.add("is-drawn"); return; }
    var tio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { tl.classList.add("is-drawn"); tio.disconnect(); } });
    }, { threshold: 0.15 });
    tio.observe(tl);
  });

  /* ---------------- Tour walkthrough (tabs + cross-fade) ---------------- */
  $$("[data-tour]").forEach(function (tour) {
    var tabs = $$('[role="tab"]', tour);
    var imgs = $$(".tour-media img", tour);
    var caps = $$(".tour-caption", tour);
    var countEl = $(".tour-count", tour);
    var media = $(".tour-media", tour);
    var cur = 0;
    function select(i, focus) {
      i = (i + tabs.length) % tabs.length;
      cur = i;
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
      });
      imgs.forEach(function (im, k) { im.classList.toggle("is-active", k === i); });
      caps.forEach(function (c, k) { c.hidden = k !== i; });
      if (media && tabs[i]) media.setAttribute("aria-labelledby", tabs[i].id);
      if (countEl) countEl.textContent = (i + 1) + " / " + tabs.length;
      if (focus && tabs[i]) tabs[i].focus();
    }
    tabs.forEach(function (t, k) {
      t.addEventListener("click", function () { select(k, false); });
      t.addEventListener("keydown", function (e) {
        var key = e.key;
        if (key === "ArrowDown" || key === "ArrowRight") { e.preventDefault(); select(k + 1, true); }
        else if (key === "ArrowUp" || key === "ArrowLeft") { e.preventDefault(); select(k - 1, true); }
        else if (key === "Home") { e.preventDefault(); select(0, true); }
        else if (key === "End") { e.preventDefault(); select(tabs.length - 1, true); }
      });
    });
    var prev = $("[data-tour-prev]", tour), next = $("[data-tour-next]", tour);
    if (prev) prev.addEventListener("click", function () { select(cur - 1, false); });
    if (next) next.addEventListener("click", function () { select(cur + 1, false); });
    // optional swipe
    if (media) {
      var sx = null;
      media.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
      media.addEventListener("touchend", function (e) {
        if (sx === null) return;
        var dx = e.changedTouches[0].clientX - sx;
        if (Math.abs(dx) > 50) select(cur + (dx < 0 ? 1 : -1), false);
        sx = null;
      });
    }
    select(0, false);
  });

  /* ---------------- Video placeholder ---------------- */
  $$("[data-video-slot]").forEach(function (slot) {
    var btn = $(".play", slot), msg = $(".video-msg", slot);
    if (!btn || !msg) return;
    btn.addEventListener("click", function () {
      msg.hidden = !msg.hidden;
      btn.setAttribute("aria-expanded", String(!msg.hidden));
    });
  });

  /* ---------------- Live view sign-in (placeholder state) ---------------- */
  $$("[data-live-signin]").forEach(function (btn) {
    var panel = doc.getElementById(btn.getAttribute("aria-controls"));
    if (!panel) return;
    btn.addEventListener("click", function () {
      panel.hidden = !panel.hidden;
      btn.setAttribute("aria-expanded", String(!panel.hidden));
      if (!panel.hidden) { var f = $("input", panel); if (f) f.focus(); }
    });
    var form = $("form", panel);
    if (form) form.addEventListener("submit", function (e) {
      e.preventDefault();
      var out = $(".live-out", panel);
      if (out) out.textContent = "Demo only — there is no camera account system in this template. In the live site, sign-in would go to [CAMERA PROVIDER — CONFIRM] and only show rooms your dog is booked into.";
    });
  });

  /* ---------------- Compare (mobile tier selector) ---------------- */
  $$("[data-compare-select]").forEach(function (sel) {
    var out = doc.getElementById(sel.getAttribute("aria-controls"));
    var data = {};
    try { data = JSON.parse(sel.getAttribute("data-tiers")); } catch (e) { data = {}; }
    function render() {
      var t = data[sel.value]; if (!t || !out) return;
      var html = "<h4>" + esc(t.name) + "</h4><dl>";
      t.rows.forEach(function (r) { html += "<dt>" + esc(r[0]) + "</dt><dd>" + r[1] + "</dd>"; });
      out.innerHTML = html + "</dl>";
    }
    sel.addEventListener("change", render);
    render();
  });

  /* ---------------- Home booking block ---------------- */
  $$("[data-mini-book]").forEach(function (form) {
    var radios = $$('input[name="mode"]', form);
    function sync() {
      var v = (radios.filter(function (r) { return r.checked; })[0] || radios[0]).value;
      $$("[data-pane]", form).forEach(function (p) { p.hidden = p.getAttribute("data-pane") !== v; });
    }
    radios.forEach(function (r) { r.addEventListener("change", sync); });
    // product buttons pre-set the control
    $$("[data-preset-mode]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        var m = a.getAttribute("data-preset-mode");
        var r = radios.filter(function (x) { return x.value === m; })[0];
        if (!r) return;
        e.preventDefault();
        r.checked = true; sync();
        form.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" });
        setTimeout(function () { r.focus({ preventScroll: true }); }, reduced() ? 0 : 450);
      });
    });
    var today = new Date(); var iso = toISO(today);
    $$('input[type="date"]', form).forEach(function (d) { d.min = iso; });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(form); var q = [];
      fd.forEach(function (v, k) { if (v) q.push(encodeURIComponent(k) + "=" + encodeURIComponent(v)); });
      window.location.href = "booking.html" + (q.length ? "?" + q.join("&") : "");
    });
    sync();
  });

  /* ---------------- Gallery filter + lightbox ---------------- */
  var filterBtns = $$("[data-filter]");
  var items = $$(".masonry-item");
  filterBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      var f = b.getAttribute("data-filter");
      filterBtns.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      items.forEach(function (it) { it.hidden = !(f === "all" || it.getAttribute("data-cat") === f); });
      var live = $("#gallery-status"); if (live) live.textContent = items.filter(function (i) { return !i.hidden; }).length + " photos shown";
    });
  });
  var lb = $("#lightbox");
  if (lb) {
    var lbImg = $("img", lb), lbCap = $("figcaption", lb), lastFocus = null, lbIdx = 0;
    function visible() { return items.filter(function (i) { return !i.hidden; }); }
    function openLb(i) {
      var list = visible(); if (!list.length) return;
      lbIdx = (i + list.length) % list.length;
      var it = list[lbIdx], im = $("img", it);
      lbImg.src = im.getAttribute("data-full") || im.currentSrc || im.src;
      lbImg.alt = im.alt;
      lbCap.textContent = ($("figcaption", it) || {}).textContent || "";
      if (lb.hidden) { lastFocus = doc.activeElement; lb.hidden = false; doc.body.style.overflow = "hidden"; $(".lb-close", lb).focus(); }
    }
    function closeLb() { lb.hidden = true; doc.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); }
    items.forEach(function (it) {
      var b = $("button", it);
      b.addEventListener("click", function () { openLb(visible().indexOf(it)); });
    });
    $(".lb-close", lb).addEventListener("click", closeLb);
    $(".lb-prev", lb).addEventListener("click", function () { openLb(lbIdx - 1); });
    $(".lb-next", lb).addEventListener("click", function () { openLb(lbIdx + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
    lb.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); closeLb(); }
      else if (e.key === "ArrowLeft") openLb(lbIdx - 1);
      else if (e.key === "ArrowRight") openLb(lbIdx + 1);
      else if (e.key === "Tab") {
        var f = $$("button", lb); var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------------- Simple demo forms (contact etc.) ---------------- */
  $$("[data-demo-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate(form)) return;
      var out = $(".form-out", form.parentNode) || $(".form-out", form);
      if (out) { out.hidden = false; out.focus(); }
      form.reset();
    });
  });

  /* ---------------- Validation helper ---------------- */
  function validate(scope) {
    var ok = true, first = null;
    $$("input, select, textarea", scope).forEach(function (el) {
      if (el.closest("[hidden]") || el.disabled) return;
      var field = el.closest(".field") || el.closest(".check") || el.parentNode;
      var msgEl = field && field.querySelector(".err-msg");
      var bad = false, msg = "";
      if (el.type === "checkbox" && el.required && !el.checked) { bad = true; msg = "Please tick this box to continue."; }
      else if (el.type === "radio" && el.required) {
        var group = $$('input[name="' + el.name + '"]', scope);
        if (!group.some(function (r) { return r.checked; })) { bad = true; msg = "Please choose an option."; }
      }
      else if (el.required && !String(el.value).trim()) { bad = true; msg = "This field is required."; }
      else if (el.type === "email" && el.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value)) { bad = true; msg = "Enter an email address like name@example.com."; }
      else if (el.type === "tel" && el.value && el.value.replace(/\D/g, "").length < 10) { bad = true; msg = "Enter a 10-digit phone number."; }
      if (field && field.classList) field.classList.toggle("has-error", bad);
      el.setAttribute("aria-invalid", bad ? "true" : "false");
      if (msgEl) msgEl.textContent = bad ? msg : "";
      if (bad) { ok = false; if (!first) first = el; }
    });
    if (first) first.focus();
    return ok;
  }

  /* ================================================================
     Calendar — real month grid, three availability states (demo data)
     modes: "range" (boarding), "multi" (daycare), "single" (start date)
     ================================================================ */
  function toISO(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function fromISO(s) { var p = String(s || "").split("-"); if (p.length !== 3) return null; var d = new Date(+p[0], +p[1] - 1, +p[2]); return isNaN(d) ? null : d; }
  function addDays(d, n) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); return x; }
  function sameDay(a, b) { return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  function dayDiff(a, b) { return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 864e5); }
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  function fmtShort(d) { return d ? DAYS[d.getDay()].slice(0, 3) + " " + MONTHS[d.getMonth()].slice(0, 3) + " " + d.getDate() : "—"; }
  function fmtLong(d) { return DAYS[d.getDay()] + ", " + MONTHS[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear(); }
  // Demo holiday periods (placeholder — client supplies real dates)
  function isPeak(d) {
    var m = d.getMonth() + 1, day = d.getDate();
    return (m === 11 && day >= 25) || (m === 12 && day >= 19) || (m === 1 && day <= 3) || (m === 7 && day >= 1 && day <= 6);
  }
  // Deterministic placeholder availability
  function availability(d) {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    if (d < today) return "past";
    var seed = d.getFullYear() * 400 + (d.getMonth() + 1) * 32 + d.getDate();
    var v = ((seed * 9301 + 49297) % 233280) / 233280;
    if (isPeak(d)) return v < 0.35 ? "full" : "limited";
    if (v < 0.07) return "full";
    if (v < 0.27 || d.getDay() === 5) return "limited";
    return "available";
  }
  var ICONS = {
    available: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    limited: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 2.5a5.5 5.5 0 0 1 0 11z" fill="currentColor"/></svg>',
    full: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 12 12 4" stroke="currentColor" stroke-width="2"/></svg>'
  };
  var WORD = { available: "Open", limited: "Limited", full: "Full", past: "" };

  function Calendar(el, opts) {
    this.el = el; this.mode = opts.mode || "range"; this.onChange = opts.onChange || function () {};
    this.start = null; this.end = null; this.multi = []; this.single = null;
    var t = new Date(); t.setHours(0, 0, 0, 0);
    this.today = t; this.view = new Date(t.getFullYear(), t.getMonth(), 1); this.focusDate = t;
    this.status = opts.status || null;
    this.build();
  }
  Calendar.prototype.setMode = function (m) { this.mode = m; this.el.setAttribute("data-mode", m); this.render(); };
  Calendar.prototype.build = function () {
    var self = this, id = this.el.id || ("cal" + Math.random().toString(36).slice(2, 7));
    this.el.classList.add("cal"); this.el.setAttribute("data-mode", this.mode);
    this.el.innerHTML =
      '<div class="cal-head">' +
      '<button type="button" class="icon-btn icon-btn--light" data-cal-prev aria-label="Previous month"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button>' +
      '<h3 class="cal-title" id="' + id + '-title" aria-live="polite"></h3>' +
      '<button type="button" class="icon-btn icon-btn--light" data-cal-next aria-label="Next month"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button>' +
      "</div>" +
      '<table class="cal-grid" role="grid" aria-labelledby="' + id + '-title"><thead><tr>' +
      DAYS.map(function (d) { return '<th scope="col" abbr="' + d + '">' + d.slice(0, 2) + "</th>"; }).join("") +
      "</tr></thead><tbody></tbody></table>";
    this.tbody = $("tbody", this.el); this.title = $(".cal-title", this.el);
    $("[data-cal-prev]", this.el).addEventListener("click", function () { self.shift(-1); });
    $("[data-cal-next]", this.el).addEventListener("click", function () { self.shift(1); });
    this.tbody.addEventListener("click", function (e) {
      var b = e.target.closest(".cal-day"); if (!b) return;
      self.pick(fromISO(b.getAttribute("data-date")), b);
    });
    this.tbody.addEventListener("keydown", function (e) { self.key(e); });
    this.render();
  };
  Calendar.prototype.shift = function (n) {
    var nv = new Date(this.view.getFullYear(), this.view.getMonth() + n, 1);
    var min = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
    if (nv < min) return;
    this.view = nv;
    if (this.focusDate.getMonth() !== nv.getMonth() || this.focusDate.getFullYear() !== nv.getFullYear()) {
      this.focusDate = nv < this.today ? this.today : nv;
      if (this.focusDate.getMonth() !== nv.getMonth()) this.focusDate = nv;
    }
    this.render();
  };
  Calendar.prototype.isSelected = function (d) {
    if (this.mode === "range") return sameDay(d, this.start) || sameDay(d, this.end);
    if (this.mode === "multi") return this.multi.some(function (x) { return sameDay(x, d); });
    return sameDay(d, this.single);
  };
  Calendar.prototype.inRange = function (d) {
    return this.mode === "range" && this.start && this.end && d > this.start && d < this.end;
  };
  Calendar.prototype.render = function () {
    var y = this.view.getFullYear(), m = this.view.getMonth();
    this.title.textContent = MONTHS[m] + " " + y;
    var first = new Date(y, m, 1), lead = first.getDay(), days = new Date(y, m + 1, 0).getDate();
    var html = "", cell = 0, focusISO = toISO(this.focusDate);
    var focusInMonth = this.focusDate.getMonth() === m && this.focusDate.getFullYear() === y;
    var firstFocusable = null;
    for (var r = 0; r < 6; r++) {
      if (cell >= lead + days) break;
      html += "<tr>";
      for (var c = 0; c < 7; c++, cell++) {
        var dn = cell - lead + 1;
        if (dn < 1 || dn > days) { html += '<td role="gridcell" aria-hidden="true"></td>'; continue; }
        var d = new Date(y, m, dn), iso = toISO(d), st = availability(d), peak = isPeak(d) && st !== "past";
        var sel = this.isSelected(d), rng = this.inRange(d);
        var disabled = st === "full" || st === "past";
        var label = fmtLong(d) + ", " + (st === "past" ? "past date, unavailable" : WORD[st].toLowerCase() === "open" ? "available" : WORD[st].toLowerCase()) + (peak ? ", peak period" : "");
        if (this.mode === "range" && sameDay(d, this.start)) label += ", check-in";
        if (this.mode === "range" && sameDay(d, this.end)) label += ", check-out";
        if (!firstFocusable && st !== "past") firstFocusable = iso;
        html += '<td role="gridcell" aria-selected="' + sel + '"' + (rng ? ' class="in-range"' : "") + (disabled ? ' aria-disabled="true"' : "") + ">" +
          '<button type="button" class="cal-day' + (peak ? " is-peak" : "") + '" data-date="' + iso + '" data-state="' + st + '" tabindex="-1" aria-label="' + label + '"' + (disabled ? ' aria-disabled="true"' : "") + ">" +
          '<span aria-hidden="true">' + dn + "</span>" +
          (st !== "past" ? '<span class="st" aria-hidden="true">' + ICONS[st] + '<span class="st-word">' + WORD[st] + "</span></span>" : "") +
          "</button></td>";
      }
      html += "</tr>";
    }
    this.tbody.innerHTML = html;
    var target = focusInMonth ? $('[data-date="' + focusISO + '"]', this.tbody) : null;
    if (!target || target.getAttribute("data-state") === "past") target = firstFocusable ? $('[data-date="' + firstFocusable + '"]', this.tbody) : $(".cal-day", this.tbody);
    if (target) { target.tabIndex = 0; this.focusDate = fromISO(target.getAttribute("data-date")); }
    $("[data-cal-prev]", this.el).disabled = (y === this.today.getFullYear() && m === this.today.getMonth());
  };
  Calendar.prototype.focusOn = function (d) {
    if (d < this.today) d = this.today;
    this.focusDate = d;
    if (d.getMonth() !== this.view.getMonth() || d.getFullYear() !== this.view.getFullYear()) {
      this.view = new Date(d.getFullYear(), d.getMonth(), 1);
    }
    this.render();
    var b = $('[data-date="' + toISO(d) + '"]', this.tbody); if (b) b.focus();
  };
  Calendar.prototype.key = function (e) {
    var b = e.target.closest(".cal-day"); if (!b) return;
    var d = fromISO(b.getAttribute("data-date")), n = null;
    switch (e.key) {
      case "ArrowRight": n = addDays(d, 1); break;
      case "ArrowLeft": n = addDays(d, -1); break;
      case "ArrowDown": n = addDays(d, 7); break;
      case "ArrowUp": n = addDays(d, -7); break;
      case "Home": n = addDays(d, -d.getDay()); break;
      case "End": n = addDays(d, 6 - d.getDay()); break;
      case "PageUp": n = new Date(d.getFullYear(), d.getMonth() - 1, Math.min(d.getDate(), 28)); break;
      case "PageDown": n = new Date(d.getFullYear(), d.getMonth() + 1, Math.min(d.getDate(), 28)); break;
      case "Enter": case " ": e.preventDefault(); this.pick(d, b); return;
      default: return;
    }
    e.preventDefault();
    this.focusOn(n);
  };
  Calendar.prototype.say = function (msg) { if (this.status) this.status.textContent = msg; };
  Calendar.prototype.pick = function (d, btn) {
    var st = btn.getAttribute("data-state");
    if (st === "past") { this.say("That date has passed."); return; }
    if (st === "full") { this.say(fmtLong(d) + " is full in the demo availability. Please choose another date."); return; }
    if (this.mode === "range") {
      if (!this.start || this.end || d <= this.start) {
        this.start = d; this.end = null;
        this.say("Check-in " + fmtShort(d) + " selected. Now choose a check-out date.");
      } else {
        var blocked = null;
        for (var x = addDays(this.start, 1); x < d; x = addDays(x, 1)) { if (availability(x) === "full") { blocked = x; break; } }
        if (blocked) { this.say("A night in that range (" + fmtShort(blocked) + ") is full in the demo availability. Choose an earlier check-out or a new check-in."); return; }
        this.end = d;
        var n = dayDiff(this.start, this.end);
        this.say("Check-out " + fmtShort(d) + " selected. " + n + (n === 1 ? " night." : " nights."));
      }
    } else if (this.mode === "multi") {
      var i = -1; this.multi.forEach(function (x, k) { if (sameDay(x, d)) i = k; });
      if (i > -1) { this.multi.splice(i, 1); this.say(fmtShort(d) + " removed. " + this.multi.length + " day(s) selected."); }
      else { this.multi.push(d); this.multi.sort(function (a, b) { return a - b; }); this.say(fmtShort(d) + " added. " + this.multi.length + " day(s) selected."); }
    } else {
      this.single = d; this.say("Start date " + fmtShort(d) + " selected.");
    }
    this.focusDate = d;
    this.render();
    var nb = $('[data-date="' + toISO(d) + '"]', this.tbody); if (nb) nb.focus();
    this.onChange(this);
  };
  Calendar.prototype.clear = function () { this.start = this.end = this.single = null; this.multi = []; this.render(); this.onChange(this); };
  Calendar.prototype.nights = function () { return this.start && this.end ? dayDiff(this.start, this.end) : 0; };
  Calendar.prototype.peakNights = function () {
    if (this.mode === "range") {
      var c = 0; if (!(this.start && this.end)) return 0;
      for (var x = this.start; x < this.end; x = addDays(x, 1)) if (isPeak(x)) c++;
      return c;
    }
    if (this.mode === "multi") return this.multi.filter(isPeak).length;
    return this.single && isPeak(this.single) ? 1 : 0;
  };

  /* ================================================================
     Booking flow (booking.html)
     ================================================================ */
  var bk = $("#booking-form");
  if (bk) {
    var RATES = window.LW_RATES || {};
    var params = new URLSearchParams(window.location.search);
    var calStatus = $("#cal-status");
    var cal = new Calendar($("#bk-cal"), { mode: "range", status: calStatus, onChange: update });
    var modeRadios = $$('input[name="bk-mode"]', bk);
    var firstRadios = $$('input[name="first-stay"]', bk);
    var gatedSteps = $$("[data-gated]", bk);
    var dogsWrap = $("#dogs"), dogTpl = $("#dog-tpl");
    var weeks = 1;

    function mode() { var r = modeRadios.filter(function (x) { return x.checked; })[0]; return r ? r.value : "boarding"; }
    function firstStay() { var r = firstRadios.filter(function (x) { return x.checked; })[0]; return r ? r.value : null; }

    function syncMode() {
      var m = mode();
      $$("[data-for-mode]", bk).forEach(function (el) { el.hidden = el.getAttribute("data-for-mode").split(" ").indexOf(m) === -1 || (el.hasAttribute("data-gated") && !firstStay()); });
      cal.setMode(m === "boarding" ? "range" : m === "daycare" ? "multi" : "single");
      $("#cal-help").textContent = m === "boarding" ? "Choose a check-in date, then a check-out date." : m === "daycare" ? "Choose one or more daycare days. Select a day again to remove it." : "Choose a start date, then set the number of weeks below.";
      $("#bk-submit-label").textContent = m === "extended" ? "Review extended-stay request" : "Review reservation";
      update();
    }
    function syncFirst() {
      var f = firstStay();
      var panel = $("#first-panel");
      if (panel) panel.hidden = f !== "yes";
      var ack = $("#intake-ack"); if (ack) ack.required = f === "yes";
      gatedSteps.forEach(function (s) {
        var fm = s.getAttribute("data-for-mode");
        s.hidden = !f || (fm ? fm.split(" ").indexOf(mode()) === -1 : false);
      });
      var gateNote = $("#gate-note"); if (gateNote) gateNote.hidden = !!f;
      update();
    }
    modeRadios.forEach(function (r) { r.addEventListener("change", function () { cal.clear(); syncMode(); }); });
    firstRadios.forEach(function (r) { r.addEventListener("change", syncFirst); });

    // week stepper
    var wOut = $("#weeks-out");
    $$("[data-weeks]", bk).forEach(function (b) {
      b.addEventListener("click", function () {
        weeks = Math.max(1, Math.min(12, weeks + parseInt(b.getAttribute("data-weeks"), 10)));
        wOut.value = weeks + (weeks === 1 ? " week" : " weeks"); wOut.textContent = wOut.value;
        update();
      });
    });

    // dog repeater
    function renumber() {
      $$(".dog-card", dogsWrap).forEach(function (c, i) {
        $("h3", c).textContent = "Dog " + (i + 1);
        $$("[data-name]", c).forEach(function (inp) {
          var id = inp.getAttribute("data-name") + "-" + (i + 1);
          inp.id = id; inp.name = id;
          var lab = $('label[data-for="' + inp.getAttribute("data-name") + '"]', c); if (lab) lab.setAttribute("for", id);
        });
        var rm = $("[data-remove-dog]", c); if (rm) rm.hidden = i === 0;
      });
      var n = $$(".dog-card", dogsWrap).length;
      $("#add-dog").disabled = n >= 4;
      update();
    }
    function addDog() {
      var node = dogTpl.content.firstElementChild.cloneNode(true);
      dogsWrap.appendChild(node);
      $("[data-remove-dog]", node).addEventListener("click", function () { node.remove(); renumber(); $("#add-dog").focus(); });
      $$("input", node).forEach(function (i) { i.addEventListener("input", update); });
      renumber();
      return node;
    }
    $("#add-dog").addEventListener("click", function () { var n = addDog(); var f = $("input", n); if (f) f.focus(); });
    addDog();

    $$("input, select", bk).forEach(function (el) { el.addEventListener("change", update); });

    function dogNames() {
      return $$(".dog-card", dogsWrap).map(function (c, i) { var v = $("input", c).value.trim(); return v || "Dog " + (i + 1); });
    }
    function tier() { var r = $('input[name="tier"]:checked', bk); return r ? r.value : null; }
    function addons() { return $$('input[name="addon"]:checked', bk).map(function (x) { return x.value; }); }

    function calc() {
      var m = mode(), dogs = $$(".dog-card", dogsWrap).length, lines = [], total = 0, unit = "";
      var ao = addons();
      if (m === "boarding") {
        var n = cal.nights(), t = tier(), tr = t && RATES.tiers[t];
        unit = n ? n + (n === 1 ? " night" : " nights") : "—";
        if (n && tr) {
          total += n * tr.rate; lines.push([tr.name + " × " + n, money(n * tr.rate)]);
          if (dogs > 1 && t !== "family") { var sd = n * (dogs - 1) * RATES.secondDog; total += sd; lines.push(["Additional dog × " + (dogs - 1), money(sd)]); }
        }
      } else if (m === "daycare") {
        var days = cal.multi.length, len = ($('input[name="daylen"]:checked', bk) || {}).value || "full";
        var pass = $("#use-pass") && $("#use-pass").checked;
        unit = days ? days + (days === 1 ? " day" : " days") : "—";
        if (pass) { total += RATES.pass * dogs; lines.push(["Day pass × " + dogs, money(RATES.pass * dogs)]); }
        else if (days) { var r = len === "half" ? RATES.half : RATES.full; total += days * r * dogs; lines.push([(len === "half" ? "Half day" : "Full day") + " × " + days + (dogs > 1 ? " × " + dogs + " dogs" : ""), money(days * r * dogs)]); }
      } else {
        unit = weeks + (weeks === 1 ? " week" : " weeks");
        if (cal.single) { total += weeks * RATES.week * dogs; lines.push(["Extended stay × " + weeks + " wk" + (dogs > 1 ? " × " + dogs + " dogs" : ""), money(weeks * RATES.week * dogs)]); }
      }
      ao.forEach(function (k) { var a = RATES.addons[k]; if (a) { total += a.price * dogs; lines.push([a.name + (dogs > 1 ? " × " + dogs : ""), money(a.price * dogs)]); } });
      return { total: total, lines: lines, unit: unit, dogs: dogs, peak: cal.peakNights() };
    }

    function datesText() {
      var m = mode();
      if (m === "boarding") return cal.start ? fmtShort(cal.start) + " → " + (cal.end ? fmtShort(cal.end) : "choose check-out") : "Not chosen";
      if (m === "daycare") return cal.multi.length ? cal.multi.map(fmtShort).join(", ") : "Not chosen";
      return cal.single ? "From " + fmtShort(cal.single) : "Not chosen";
    }

    function update() {
      var m = mode(), c = calc();
      $("#ro-in").textContent = m === "boarding" ? fmtShort(cal.start) : m === "daycare" ? (cal.multi[0] ? fmtShort(cal.multi[0]) : "—") : fmtShort(cal.single);
      $("#ro-out").textContent = m === "boarding" ? fmtShort(cal.end) : m === "daycare" ? (cal.multi.length > 1 ? fmtShort(cal.multi[cal.multi.length - 1]) : "—") : (cal.single ? fmtShort(addDays(cal.single, weeks * 7)) : "—");
      $("#ro-n").textContent = c.unit;
      $("#ro-in-l").textContent = m === "boarding" ? "Check-in" : m === "daycare" ? "First day" : "Start";
      $("#ro-out-l").textContent = m === "boarding" ? "Check-out" : m === "daycare" ? "Last day" : "Ends (approx.)";
      $("#ro-n-l").textContent = m === "boarding" ? "Nights" : m === "daycare" ? "Days" : "Length";
      var t = tier();
      var modeName = { boarding: "Boarding", daycare: "Daycare", extended: "Extended stay" }[m];
      $("#s-mode").textContent = modeName;
      $("#s-dates").textContent = datesText();
      $("#s-len").textContent = c.unit;
      $("#s-tier").textContent = m === "boarding" ? (t ? RATES.tiers[t].name : "Not chosen") : m === "daycare" ? ((($('input[name="daylen"]:checked', bk) || {}).value === "half") ? "Half day" : "Full day") : "Arranged with the lodge";
      $("#s-tier-l").textContent = m === "boarding" ? "Suite" : m === "daycare" ? "Day length" : "Room";
      $("#s-dogs").textContent = dogNames().join(", ");
      var lines = $("#s-lines");
      lines.innerHTML = c.lines.map(function (l) { return "<dt>" + esc(l[0]) + "</dt><dd>" + l[1] + "</dd>"; }).join("");
      $("#s-total").innerHTML = c.total ? money(c.total) : ph("$[—]");
      var pk = $("#s-peak");
      pk.hidden = !c.peak;
      pk.innerHTML = c.peak ? "Includes " + c.peak + " peak-period " + (m === "boarding" ? "night" : "day") + (c.peak === 1 ? "" : "s") + ": " + ph("[PEAK / HOLIDAY RATE — CONFIRM]") + " not included in this demo estimate." : "";
      var bar = $("#summary-bar-text");
      if (bar) bar.innerHTML = "Summary · " + esc(c.unit) + " · " + (c.total ? money(c.total) : ph("$[—]")) + ' <span class="visually-hidden">demo estimate</span>';
      $("#first-row").hidden = firstStay() !== "yes";
      store("lw-booking-mode", m);
    }

    // summary toggle (mobile)
    var sBar = $(".summary-bar");
    if (sBar) sBar.addEventListener("click", function () {
      var s = $(".summary"); var open = s.classList.toggle("is-open");
      sBar.setAttribute("aria-expanded", String(open));
    });

    // review + confirm
    bk.addEventListener("submit", function (e) {
      e.preventDefault();
      var m = mode(), errs = [];
      if (!firstStay()) { errs.push("Tell us whether this is your first stay."); }
      if (!validate(bk)) return;
      if (m === "boarding" && !(cal.start && cal.end)) errs.push("Choose check-in and check-out dates on the calendar.");
      if (m === "boarding" && !tier()) errs.push("Choose a suite.");
      if (m === "daycare" && !cal.multi.length && !($("#use-pass") && $("#use-pass").checked)) errs.push("Choose at least one daycare day, or select the day pass.");
      if (m === "extended" && !cal.single) errs.push("Choose a start date for the extended stay.");
      var box = $("#bk-errors");
      if (errs.length) {
        box.hidden = false;
        box.innerHTML = "<strong>Before you review:</strong><ul>" + errs.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
        box.focus();
        return;
      }
      box.hidden = true;
      var c = calc(), rv = $("#review");
      var rows = [
        ["Service", { boarding: "Boarding", daycare: "Daycare", extended: "Extended stay (request — arranged, not instant)" }[m]],
        ["First stay", firstStay() === "yes" ? "Yes — meet and greet " + ph("[MEET AND GREET / TRIAL DAY — CONFIRM]") + " and online intake before the stay" : "No — returning guest"],
        ["Dates", esc(datesText())],
        ["Length", esc(c.unit)],
        ["Dogs", esc(dogNames().join(", "))],
        ["Add-ons", addons().length ? addons().map(function (k) { return esc(RATES.addons[k].name); }).join(", ") : "None"],
        ["Estimated total", (c.total ? money(c.total) : ph("$[—]")) + " <small>(demo estimate — every figure is a placeholder)</small>"]
      ];
      if (m === "boarding") rows.splice(4, 0, ["Suite", esc(RATES.tiers[tier()].name)]);
      $("#review-list").innerHTML = rows.map(function (r) { return "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>"; }).join("");
      rv.hidden = false; $("#confirm").hidden = true;
      $("#review-h").focus();
    });
    $("#review-edit").addEventListener("click", function () { $("#review").hidden = true; $("#bk-dates-h").focus(); });
    $("#review-confirm").addEventListener("click", function () {
      var cb = $("#confirm");
      cb.hidden = false;
      $("#confirm-mode").textContent = mode() === "extended" ? "extended-stay request" : "reservation";
      $("#confirm-h").focus();
    });

    // presets from query string
    var pm = params.get("mode");
    if (pm) { var r = modeRadios.filter(function (x) { return x.value === pm; })[0]; if (r) r.checked = true; }
    var pt = params.get("tier");
    if (pt) { var tr = $('input[name="tier"][value="' + pt + '"]', bk); if (tr) tr.checked = true; }
    var pf = params.get("first");
    if (pf) { var fr = firstRadios.filter(function (x) { return x.value === pf; })[0]; if (fr) fr.checked = true; }
    syncMode(); syncFirst();
    var pin = fromISO(params.get("checkin") || params.get("day") || params.get("start"));
    var pout = fromISO(params.get("checkout"));
    function presetPick(d) { if (!d || availability(d) === "past" || availability(d) === "full") return false; cal.focusOn(d); var b = $('[data-date="' + toISO(d) + '"]', cal.tbody); if (b) { cal.pick(d, b); return true; } return false; }
    if (pin) {
      if (presetPick(pin) && pout && mode() === "boarding") presetPick(pout);
      if (doc.activeElement && doc.activeElement.classList.contains("cal-day")) doc.activeElement.blur();
      window.scrollTo(0, 0);
    }
    var pw = parseInt(params.get("weeks"), 10);
    if (pw > 1 && pw <= 12) { weeks = pw; wOut.value = weeks + " weeks"; wOut.textContent = wOut.value; }
    update();
  }

  /* ================================================================
     New-client intake (new-client.html) — 5 steps, save & resume
     ================================================================ */
  var intake = $("#intake-form");
  if (intake) {
    var KEY = "lw-intake-v1";
    var steps = $$(".intake-step", intake);
    var marks = $$(".progress li");
    var ptext = $("#progress-text");
    var petsWrap = $("#pets"), petTpl = $("#pet-tpl");
    var saveNote = $("#save-note");
    var cur = 0;

    function petCount() { return $$(".pet-card", petsWrap).length; }
    function renumberPets() {
      $$(".pet-card", petsWrap).forEach(function (c, i) {
        $("h3", c).textContent = "Dog " + (i + 1) + " profile";
        $$("[data-name]", c).forEach(function (inp) {
          var id = inp.getAttribute("data-name") + "-" + (i + 1);
          if (inp.type === "radio") { inp.name = inp.getAttribute("data-name") + "-" + (i + 1); inp.id = id + "-" + inp.value; var l = inp.parentNode; if (l && l.tagName === "LABEL") l.setAttribute("for", inp.id); }
          else { inp.id = id; inp.name = id; var lab = $('label[data-for="' + inp.getAttribute("data-name") + '"]', c); if (lab) lab.setAttribute("for", id); }
        });
        $$("[data-err]", c).forEach(function (er) { er.id = er.getAttribute("data-err") + "-" + (i + 1) + "-err"; });
        var rm = $("[data-remove-pet]", c); if (rm) rm.hidden = i === 0;
      });
      $("#add-pet").disabled = petCount() >= 4;
    }
    function addPet() {
      var node = petTpl.content.firstElementChild.cloneNode(true);
      petsWrap.appendChild(node);
      $("[data-remove-pet]", node).addEventListener("click", function () { node.remove(); renumberPets(); save(); $("#add-pet").focus(); });
      renumberPets();
      return node;
    }
    $("#add-pet").addEventListener("click", function () { var n = addPet(); $("input", n).focus(); save(); });

    function show(i, focus) {
      cur = Math.max(0, Math.min(steps.length - 1, i));
      steps.forEach(function (s, k) { s.hidden = k !== cur; });
      marks.forEach(function (m, k) {
        m.classList.toggle("is-done", k < cur);
        if (k === cur) m.setAttribute("aria-current", "step"); else m.removeAttribute("aria-current");
      });
      if (ptext) ptext.textContent = "Step " + (cur + 1) + " of " + steps.length + ": " + steps[cur].getAttribute("data-title");
      if (focus) { var lg = $("legend", steps[cur]) || steps[cur]; lg.setAttribute("tabindex", "-1"); lg.focus(); }
    }
    function collect() {
      var data = { step: cur, pets: petCount(), fields: {} };
      $$("input, select, textarea", intake).forEach(function (el) {
        if (!el.name || el.type === "file") return;
        if (el.type === "checkbox") data.fields[el.name] = el.checked;
        else if (el.type === "radio") { if (el.checked) data.fields[el.name] = el.value; }
        else data.fields[el.name] = el.value;
      });
      return data;
    }
    function save() {
      store(KEY, collect());
      if (saveNote) saveNote.textContent = "Progress saved on this device at " + new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) + ". Uploaded files are not saved — you'll re-attach them if you resume.";
    }
    function restore(data) {
      while (petCount() < (data.pets || 1)) addPet();
      Object.keys(data.fields || {}).forEach(function (name) {
        var els = $$('[name="' + name + '"]', intake);
        els.forEach(function (el) {
          if (el.type === "checkbox") el.checked = !!data.fields[name];
          else if (el.type === "radio") el.checked = el.value === data.fields[name];
          else el.value = data.fields[name];
        });
      });
      show(data.step || 0, false);
    }
    addPet();
    var saved = store(KEY);
    var banner = $("#resume-banner");
    if (saved && banner) {
      banner.hidden = false;
      $("#resume-yes").addEventListener("click", function () { restore(saved); banner.hidden = true; var lg = $("legend", steps[cur]); if (lg) { lg.setAttribute("tabindex", "-1"); lg.focus(); } });
      $("#resume-no").addEventListener("click", function () { store(KEY, null); banner.hidden = true; });
    }
    intake.addEventListener("input", function () { save(); });
    intake.addEventListener("change", function () { save(); });

    $$("[data-next]", intake).forEach(function (b) {
      b.addEventListener("click", function () {
        if (!validate(steps[cur])) return;
        show(cur + 1, true); save();
        window.scrollTo({ top: intake.getBoundingClientRect().top + window.scrollY - 120, behavior: reduced() ? "auto" : "smooth" });
      });
    });
    $$("[data-back]", intake).forEach(function (b) {
      b.addEventListener("click", function () { show(cur - 1, true); save(); });
    });
    var fileIn = $("#records");
    if (fileIn) fileIn.addEventListener("change", function () {
      var list = $("#file-list");
      list.innerHTML = Array.prototype.map.call(fileIn.files, function (f) { return "<li>" + esc(f.name) + " — " + Math.max(1, Math.round(f.size / 1024)) + " KB (kept in this browser only; demo)</li>"; }).join("");
    });
    $("#clear-saved").addEventListener("click", function () {
      store(KEY, null);
      if (saveNote) saveNote.textContent = "Saved progress cleared from this device.";
    });
    intake.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate(steps[cur])) return;
      store(KEY, null);
      steps.forEach(function (s) { s.hidden = true; });
      marks.forEach(function (m) { m.classList.add("is-done"); m.removeAttribute("aria-current"); });
      if (ptext) ptext.textContent = "All steps complete (demo)";
      var done = $("#intake-done"); done.hidden = false;
      var h = $("h2", done); h.setAttribute("tabindex", "-1"); h.focus();
    });
    show(0, false);
  }
})();
