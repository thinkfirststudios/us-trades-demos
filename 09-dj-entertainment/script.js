/* Nightgrade Sound — DEMO TEMPLATE 09 · ThinkFirst Studios
   Plain JS, no dependencies. Motion: hard cut and snap (140ms). Nothing loops;
   the only continuous motion is a waveform playhead while a (user-started) preview plays. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  var RM = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  function reduced() { return RM.matches; }
  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }
  window.NG_READY = true;

  /* ---------- year ---------- */
  $$("[data-year]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  /* ---------- toast ---------- */
  var toastEl = $("[data-toast]"), toastT;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg; toastEl.classList.add("is-on");
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("is-on"); }, 4200);
  }

  /* ---------- header: condense + mobile menu ---------- */
  var head = $("[data-head]");
  function onScrollHead() { if (head) head.classList.toggle("is-condensed", window.scrollY > 40); }
  var menuBtn = $("[data-menu]"), mnav = $("#mnav");
  if (menuBtn && mnav) {
    menuBtn.addEventListener("click", function () {
      var open = menuBtn.getAttribute("aria-expanded") === "true";
      menuBtn.setAttribute("aria-expanded", String(!open));
      mnav.classList.toggle("is-open", !open);
    });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mnav.classList.contains("is-open")) { menuBtn.click(); menuBtn.focus(); }
    });
    $$("a", mnav).forEach(function (a) { a.addEventListener("click", function () { if (mnav.classList.contains("is-open")) menuBtn.click(); }); });
  }

  /* ---------- reveal + waveform sweep ---------- */
  var reveals = $$(".reveal"), waves = $$("[data-wave]");
  function showAll() { reveals.forEach(function (el) { el.classList.add("is-in"); }); waves.forEach(function (w) { w.classList.add("is-in"); }); }
  if (!("IntersectionObserver" in window) || reduced()) { showAll(); }
  else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.15 });
    reveals.forEach(function (el) { io.observe(el); });
    waves.forEach(function (el) { io.observe(el); });
  }

  /* ---------- diagonal cut: angle 0 → 6° over the first 200px of entry ---------- */
  var cuts = $$("[data-cut]");
  function updateCuts() {
    if (reduced()) { cuts.forEach(function (c) { c.style.setProperty("--p", "1"); }); return; }
    var vh = window.innerHeight;
    cuts.forEach(function (c) {
      var top = c.getBoundingClientRect().top;
      var p = Math.max(0, Math.min(1, (vh - top) / 200));
      c.style.setProperty("--p", p.toFixed(3));
    });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { ticking = false; onScrollHead(); updateCuts(); });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScrollHead(); updateCuts();

  /* ---------- count-ups (700ms, brackets stay in markup) ---------- */
  var counts = $$("[data-count]");
  function runCount(el) {
    var to = parseInt(el.getAttribute("data-count"), 10) || 0;
    if (reduced()) { el.textContent = String(to); return; }
    var t0 = null;
    function step(t) {
      if (t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / 700);
      el.textContent = String(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(step);
    }
    el.textContent = "0"; requestAnimationFrame(step);
  }
  if (counts.length) {
    if (!("IntersectionObserver" in window)) counts.forEach(function (el) { el.textContent = el.getAttribute("data-count"); });
    else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { runCount(en.target); cio.unobserve(en.target); } });
      }, { threshold: 0.4 });
      counts.forEach(function (el) { cio.observe(el); });
    }
  }

  /* ======================================================================
     DEMO PLAYERS — Web Audio "demo tone" preview, user-initiated only.
     No files, no embeds. A quiet 30-second pad; playhead tracks the audio clock.
     ====================================================================== */
  var PREVIEW = 30, actx = null, current = null;
  var CHORDS = [[220, 277.18, 329.63], [196, 246.94, 293.66], [174.61, 220, 261.63], [164.81, 207.65, 246.94], [233.08, 293.66, 349.23],
                [185, 233.08, 277.18], [207.65, 261.63, 311.13], [220, 261.63, 329.63], [196, 233.08, 293.66], [246.94, 311.13, 369.99]];
  function fmt(s) { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60); }

  function Player(el) {
    this.el = el; this.btn = $(".play", el); this.wave = $("[data-wave]", el); this.elapsed = $("[data-elapsed]", el);
    this.key = parseInt(el.getAttribute("data-key"), 10) || 0; this.offset = 0; this.nodes = null; this.raf = 0;
    var self = this;
    this.btn.addEventListener("click", function () { self.playing() ? self.pause() : self.play(); });
    this.wave.addEventListener("click", function (e) {
      var r = self.wave.getBoundingClientRect(); var k = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      self.offset = k * PREVIEW; self.draw(self.offset);
      if (self.playing()) { self.stopNodes(); self.startNodes(); }
    });
  }
  Player.prototype.playing = function () { return !!this.nodes; };
  Player.prototype.startNodes = function () {
    var ctx = actx, now = ctx.currentTime, ch = CHORDS[this.key % CHORDS.length];
    var master = ctx.createGain(); master.gain.setValueAtTime(0, now); master.gain.linearRampToValueAtTime(0.05, now + 0.6);
    var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900; lp.Q.value = 0.7;
    var lfo = ctx.createOscillator(), lfoG = ctx.createGain(); lfo.frequency.value = 0.08; lfoG.gain.value = 350; lfo.connect(lfoG); lfoG.connect(lp.frequency);
    var oscs = ch.map(function (f, i) {
      var o = ctx.createOscillator(); o.type = i === 0 ? "triangle" : "sine"; o.frequency.value = f; o.detune.value = (i - 1) * 4; o.connect(lp); return o;
    });
    var sub = ctx.createOscillator(); sub.type = "sine"; sub.frequency.value = ch[0] / 2; var subG = ctx.createGain(); subG.gain.value = 0.6; sub.connect(subG); subG.connect(lp);
    lp.connect(master); master.connect(ctx.destination);
    oscs.concat([sub, lfo]).forEach(function (o) { o.start(now); });
    this.nodes = { master: master, all: oscs.concat([sub, lfo]) };
    this.startAt = now - this.offset;
  };
  Player.prototype.stopNodes = function () {
    if (!this.nodes) return;
    var ctx = actx, now = ctx.currentTime, n = this.nodes;
    n.master.gain.cancelScheduledValues(now); n.master.gain.setValueAtTime(n.master.gain.value, now); n.master.gain.linearRampToValueAtTime(0, now + 0.12);
    n.all.forEach(function (o) { try { o.stop(now + 0.15); } catch (e) {} });
    this.nodes = null;
  };
  Player.prototype.play = function () {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { toast("Audio preview isn’t supported in this browser. [AUDIO FILE — client to supply]"); return; }
    if (!actx) actx = new AC();
    if (actx.state === "suspended") actx.resume();
    if (current && current !== this) current.pause();
    current = this;
    if (this.offset >= PREVIEW) this.offset = 0;
    this.startNodes();
    this.btn.setAttribute("aria-pressed", "true");
    this.btn.setAttribute("aria-label", this.btn.getAttribute("aria-label").replace("Play", "Pause"));
    this.el.classList.add("is-playing");
    this.tick();
  };
  Player.prototype.pause = function (ended) {
    if (this.nodes) this.offset = ended ? 0 : Math.min(PREVIEW, actx.currentTime - this.startAt);
    this.stopNodes(); cancelAnimationFrame(this.raf);
    this.btn.setAttribute("aria-pressed", "false");
    this.btn.setAttribute("aria-label", this.btn.getAttribute("aria-label").replace("Pause", "Play"));
    this.el.classList.remove("is-playing");
    this.draw(this.offset);
    if (current === this) current = null;
  };
  Player.prototype.draw = function (t) {
    this.wave.style.setProperty("--pp", (Math.min(1, t / PREVIEW) * 100).toFixed(2) + "%");
    if (this.elapsed) this.elapsed.textContent = fmt(t);
  };
  Player.prototype.tick = function () {
    var self = this;
    this.raf = requestAnimationFrame(function () {
      if (!self.nodes) return;
      var t = actx.currentTime - self.startAt;
      if (t >= PREVIEW) { self.pause(true); return; }
      self.draw(t); self.tick();
    });
  };
  $$("[data-player]").forEach(function (el) { new Player(el); });

  /* ---------- video placeholders: never autoplay ---------- */
  $$("[data-video]").forEach(function (b) {
    b.addEventListener("click", function () {
      var msg = "[VIDEO — client to supply] · the poster is a placeholder; the real clip loads here, paused, with sound off until you choose.";
      var scope = b.closest("section");
      var slot = scope && $("[data-video-msg]", scope);
      if (slot) slot.textContent = msg; else toast(msg);
    });
  });

  /* ---------- carousel: hard 140ms cut, no cross-fade ---------- */
  $$("[data-carousel]").forEach(function (car) {
    var slides = $$("[data-slide]", car), i = 0, n = slides.length;
    var caps = (car.getAttribute("data-captions") || "").split("|");
    var capEl = $("[data-car-cap]", car.parentNode);
    function set() {
      slides.forEach(function (s, k) {
        s.classList.remove("is-prev", "is-next", "is-hidden");
        var btn = $(".car-poster-btn", s);
        if (k === i) { s.removeAttribute("aria-hidden"); if (btn) btn.tabIndex = 0; }
        else {
          s.setAttribute("aria-hidden", "true"); if (btn) btn.tabIndex = -1;
          if (k === (i + n - 1) % n) s.classList.add("is-prev");
          else if (k === (i + 1) % n) s.classList.add("is-next");
          else s.classList.add("is-hidden");
        }
      });
      if (capEl && caps[i]) capEl.textContent = caps[i];
    }
    var prev = $("[data-car-prev]", car), next = $("[data-car-next]", car);
    if (prev) prev.addEventListener("click", function () { i = (i + n - 1) % n; set(); });
    if (next) next.addEventListener("click", function () { i = (i + 1) % n; set(); });
    car.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { i = (i + n - 1) % n; set(); }
      if (e.key === "ArrowRight") { i = (i + 1) % n; set(); }
    });
    set();
  });

  /* ---------- media filter ---------- */
  var filters = $("[data-filters]");
  if (filters) {
    var fbtns = $$("[data-filter]", filters);
    function applyFilter(f) {
      fbtns.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-filter") === f)); });
      $$("[data-block]").forEach(function (blk) { blk.hidden = !(f === "all" || blk.getAttribute("data-block") === f); });
    }
    fbtns.forEach(function (b) { b.addEventListener("click", function () { applyFilter(b.getAttribute("data-filter")); }); });
  }

  /* ======================================================================
     AVAILABILITY CALENDAR (static demo states) + BOOKING FORM binding
     States: available · held · booked · window ([BOOKING WINDOW — CONFIRM])
     ====================================================================== */
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var windowEnd = new Date(today.getFullYear(), today.getMonth() + 16, 0); // demo window: ~15 months ahead
  var STATE_LABEL = { available: "Available", held: "Held", booked: "Booked", window: "[BOOKING WINDOW — CONFIRM]" };

  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function parseIso(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ""); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; }
  function hash(n) { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15); return (n >>> 0) / 4294967295; }
  function stateOf(d) {
    if (d < today || d > windowEnd) return "window";
    var r = hash(d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate());
    var dow = d.getDay(), weeksOut = (d - today) / 6048e5, near = weeksOut < 10 ? 0.15 : 0;
    if (dow === 6) return r < 0.42 + near ? "booked" : r < 0.62 + near ? "held" : "available";
    if (dow === 5) return r < 0.22 + near ? "booked" : r < 0.36 + near ? "held" : "available";
    if (dow === 0) return r < 0.14 ? "booked" : r < 0.22 ? "held" : "available";
    return r < 0.05 ? "booked" : r < 0.09 ? "held" : "available";
  }
  function longDate(d) { return DOW[d.getDay()] + ", " + MONTHS[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear(); }
  function shortDate(d) { return DOW[d.getDay()].slice(0, 3).toUpperCase() + " · " + MONTHS[d.getMonth()].slice(0, 3).toUpperCase() + " " + d.getDate() + " " + d.getFullYear(); }

  var selected = null;
  var dateField = $("[data-datefield]"), selText = $("[data-seldate-text]");
  var cals = [];

  function reflectSelection(d, st, fromCal) {
    selected = d;
    if (selText) selText.textContent = d ? shortDate(d) + " — " + STATE_LABEL[st].toUpperCase() : "None yet — pick one on the calendar or below";
    if (dateField && d && fromCal) dateField.value = iso(d);
    cals.forEach(function (c) { c.mark(); });
  }

  function Calendar(el) {
    this.el = el; this.max = parseInt(el.getAttribute("data-months"), 10) || 1; this.n = this.fit();
    this.view = new Date(today.getFullYear(), today.getMonth(), 1);
    this.box = $("[data-cal-months]", el); this.range = $("[data-cal-range]", el);
    this.prev = $("[data-cal-prev]", el); this.next = $("[data-cal-next]", el);
    this.status = $("[data-cal-status]", el.parentNode) || $("[data-cal-status]");
    var self = this;
    this.prev.addEventListener("click", function () { self.shift(-1); });
    this.next.addEventListener("click", function () { self.shift(1); });
    window.addEventListener("resize", function () { var n = self.fit(); if (n !== self.n) { self.n = n; self.render(); } });
    this.render();
  }
  Calendar.prototype.fit = function () {
    if (this.max < 2) return 1;
    var w = window.innerWidth;
    return Math.min(this.max, w >= 1200 ? 3 : w >= 760 ? 2 : 1);
  };
  Calendar.prototype.shift = function (k) { this.view = new Date(this.view.getFullYear(), this.view.getMonth() + k, 1); this.render(); };
  Calendar.prototype.goTo = function (d) {
    var last = new Date(this.view.getFullYear(), this.view.getMonth() + this.n - 1, 1);
    if (d < this.view || d > new Date(last.getFullYear(), last.getMonth() + 1, 0)) { this.view = new Date(d.getFullYear(), d.getMonth(), 1); this.render(); }
    else this.mark();
  };
  Calendar.prototype.render = function () {
    var self = this, html = "", minView = new Date(today.getFullYear(), today.getMonth(), 1);
    var maxView = new Date(windowEnd.getFullYear(), windowEnd.getMonth() + 1, 1);
    if (this.view < minView) this.view = minView;
    for (var m = 0; m < this.n; m++) {
      var first = new Date(this.view.getFullYear(), this.view.getMonth() + m, 1);
      var days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
      html += '<div class="cal-month"><h3>' + MONTHS[first.getMonth()] + " " + first.getFullYear() + '</h3><div class="cal-dow" aria-hidden="true"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div><div class="cal-days">';
      for (var b = 0; b < first.getDay(); b++) html += '<span class="day is-blank" aria-hidden="true"></span>';
      for (var dd = 1; dd <= days; dd++) {
        var d = new Date(first.getFullYear(), first.getMonth(), dd), st = stateOf(d), k = b + dd - 1;
        var dis = (st === "booked" || st === "window") ? " disabled" : "";
        html += '<button type="button" class="day s-' + st + (+d === +today ? " is-today" : "") + '" data-date="' + iso(d) + '" data-state="' + st + '" style="--i:' + k + '" aria-pressed="false" aria-label="' + longDate(d) + " — " + STATE_LABEL[st] + '"' + dis + ">" + dd + '<span class="dot" aria-hidden="true"></span></button>';
      }
      html += "</div></div>";
    }
    var animate = !reduced();
    if (animate) this.el.classList.add("is-rendering");
    this.box.innerHTML = html; this.box.setAttribute("data-count", String(this.n));
    var lastShown = new Date(this.view.getFullYear(), this.view.getMonth() + this.n - 1, 1);
    this.range.textContent = this.n === 1 ? MONTHS[this.view.getMonth()] + " " + this.view.getFullYear()
      : MONTHS[this.view.getMonth()].slice(0, 3) + " " + this.view.getFullYear() + " – " + MONTHS[lastShown.getMonth()].slice(0, 3) + " " + lastShown.getFullYear();
    this.prev.disabled = +this.view <= +minView;
    this.next.disabled = +lastShown >= +maxView;
    $$(".day[data-date]", this.box).forEach(function (btn) {
      btn.addEventListener("click", function () { self.pick(btn); });
    });
    this.mark();
    if (animate) { void this.box.offsetWidth; requestAnimationFrame(function () { self.el.classList.remove("is-rendering"); }); }
  };
  Calendar.prototype.mark = function () {
    var sel = selected ? iso(selected) : "";
    $$(".day[data-date]", this.box).forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-date") === sel)); });
  };
  Calendar.prototype.pick = function (btn) {
    var d = parseIso(btn.getAttribute("data-date")), st = btn.getAttribute("data-state");
    reflectSelection(d, st, true);
    var msg = st === "held"
      ? longDate(d) + " is held by another client for [HOW LONG A HOLD LASTS — CONFIRM]. You can still request it — we’ll tell you if it releases."
      : longDate(d) + " is available. It’s in the booking form below.";
    if (this.status) this.status.textContent = msg;
    var form = $("[data-bookform]");
    if (form) {
      var top = $("#book");
      setTimeout(function () {
        (top || form).scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
        var nm = $("#bf-name"); if (nm && !nm.value) nm.focus({ preventScroll: true });
      }, reduced() ? 0 : 160);
    }
  };
  $$("[data-cal]").forEach(function (el) { cals.push(new Calendar(el)); });

  if (dateField) {
    dateField.addEventListener("change", function () {
      var d = parseIso(dateField.value);
      if (!d) { reflectSelection(null); return; }
      var st = stateOf(d);
      reflectSelection(d, st, false);
      cals.forEach(function (c) { c.goTo(d); });
      if (st === "booked") toast(longDate(d) + " is already booked in this demo calendar — try another date.");
      if (st === "window") toast(longDate(d) + " is outside the booking window — [BOOKING WINDOW — CONFIRM].");
    });
  }

  /* ---------- package pre-fill from tier cards / URL ---------- */
  var pkgField = $("[data-packagefield]");
  $$("[data-package]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      if (!pkgField) return; // other page: follow link (book.html?package=…)
      var href = a.getAttribute("href") || "";
      if (href.charAt(0) === "#") {
        e.preventDefault();
        pkgField.value = a.getAttribute("data-package");
        var t = $("#book"); if (t) t.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
        setTimeout(function () { pkgField.focus({ preventScroll: true }); }, reduced() ? 0 : 200);
      }
    });
  });
  try {
    var qs = new URLSearchParams(window.location.search);
    if (pkgField && qs.get("package")) pkgField.value = qs.get("package");
    var ty = qs.get("type");
    if (ty) { var r = $('input[name="etype"][value="' + ty.replace(/[^A-Za-z]/g, "").replace(/s$/, "").replace(/^Wedding$/, "Wedding") + '"]'); if (r) r.checked = true; }
  } catch (e) {}

  /* ---------- booking form ---------- */
  var form = $("[data-bookform]");
  if (form) {
    var start = $("[data-start]", form), end = $("[data-end]", form), out = $("[data-length]", form);
    function mins(v) { var m = /^(\d{2}):(\d{2})/.exec(v || ""); return m ? (+m[1]) * 60 + (+m[2]) : null; }
    function calc() {
      var a = mins(start.value), b = mins(end.value);
      if (a === null || b === null) { out.textContent = "Set start and end"; return; }
      var len = b - a; if (len <= 0) len += 1440;
      out.textContent = Math.floor(len / 60) + "h " + String(len % 60).padStart(2, "0") + "m of music";
    }
    start.addEventListener("change", calc); end.addEventListener("change", calc);
    var nov = $("[data-novenue]", form), venue = $("#bf-venue");
    if (nov && venue) nov.addEventListener("change", function () { venue.disabled = nov.checked; if (nov.checked) venue.value = ""; });

    var errEl = $("[data-formerr]", form), confirmEl = $("[data-confirm]");
    function clearErr() { $$(".has-err", form).forEach(function (x) { x.classList.remove("has-err"); }); $$("[aria-invalid]", form).forEach(function (x) { x.removeAttribute("aria-invalid"); }); }
    form.addEventListener("submit", function (e) {
      e.preventDefault(); clearErr();
      var bad = [];
      $$("input[required], select[required]", form).forEach(function (f) {
        if (f.type === "radio") {
          if (!form.querySelector('input[name="' + f.name + '"]:checked') && bad.indexOf(f.name) < 0) { bad.push(f.name); var fs = f.closest(".fset"); if (fs) fs.classList.add("has-err"); }
          return;
        }
        var ok = f.type === "checkbox" ? f.checked : (f.value.trim() !== "" && (f.type !== "email" || /.+@.+\..+/.test(f.value)));
        if (!ok) { bad.push(f.name); f.setAttribute("aria-invalid", "true"); var fl = f.closest(".field"); if (fl) fl.classList.add("has-err"); }
      });
      var d = parseIso(dateField ? dateField.value : ""), st = d ? stateOf(d) : null;
      if (d && (st === "booked" || st === "window")) { bad.push("date"); dateField.setAttribute("aria-invalid", "true"); }
      if (bad.length) {
        errEl.hidden = false;
        errEl.textContent = "Please check: " + bad.map(function (n) { return ({ name: "name", email: "email", phone: "phone", date: d && st ? "event date (" + STATE_LABEL[st] + ")" : "event date", etype: "event type", town: "venue town", start: "start time", end: "end time", guests: "guest headcount", package: "package", limiter: "sound limiter question", consent: "consent" })[n] || n; }).join(", ") + ".";
        var firstBad = form.querySelector("[aria-invalid='true'], .fset.has-err input");
        if (firstBad) firstBad.focus();
        return;
      }
      errEl.hidden = true;
      var fd = new FormData(form), addons = fd.getAll("addons");
      var pkgSel = $("#bf-package");
      var rows = [["Date", shortDate(d) + " — " + STATE_LABEL[st]], ["Event", fd.get("etype")], ["Venue", (fd.get("venue") || "Not booked yet") + ", " + fd.get("town")],
                  ["Times", fd.get("start") + " – " + fd.get("end") + " (" + out.textContent + ")"], ["Guests", fd.get("guests")],
                  ["Package", pkgSel.options[pkgSel.selectedIndex].text], ["Add-ons", addons.length ? addons.join(", ") : "None"], ["Limiter / power", fd.get("limiter")]];
      var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
      confirmEl.innerHTML = "<h3>Demo booking recorded</h3><p>This is a demo — nothing was sent and no payment was taken. On the live site this request goes to <span class=\"ph\">[FORM HANDLER — CONFIRM]</span>, the date is held for <span class=\"ph\">[HOW LONG A HOLD LASTS — CONFIRM]</span> and confirmed on <span class=\"ph\">[DEPOSIT TO HOLD A DATE — CONFIRM]</span>.</p><dl>" +
        rows.map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") +
        "</dl><p class=\"hint\"><span class=\"ph\">[RESPONSE EXPECTATION — CONFIRM]</span></p><button class=\"btn btn-pill\" type=\"button\" data-again>Start another booking</button>";
      form.hidden = true; confirmEl.hidden = false; confirmEl.focus();
      $("[data-again]", confirmEl).addEventListener("click", function () { form.reset(); calc(); if (venue) venue.disabled = false; reflectSelection(null); confirmEl.hidden = true; form.hidden = false; $("#bf-name").focus(); });
    });
  }
})();
