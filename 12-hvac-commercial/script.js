/* Meridian Mechanical Services — DEMO template 12. Client-side only; nothing is sent or stored. */
(function () {
  "use strict";
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.__mmsReady = true;

  /* ---- condensing header ---- */
  var head = document.querySelector(".head");
  function onScroll() {
    if (!head) return;
    var y = window.scrollY || window.pageYOffset;
    head.classList.toggle("is-condensed", y > 60);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- mobile menu ---- */
  var mbtn = document.querySelector(".menu-btn");
  var mnav = document.getElementById("mnav");
  if (mbtn && mnav) {
    mbtn.addEventListener("click", function () {
      var open = mbtn.getAttribute("aria-expanded") === "true";
      mbtn.setAttribute("aria-expanded", String(!open));
      mnav.classList.toggle("open", !open);
      mnav.hidden = open;
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mbtn.getAttribute("aria-expanded") === "true") {
        mbtn.click(); mbtn.focus();
      }
    });
    mnav.addEventListener("click", function (e) {
      if (e.target.closest("a") && mbtn.getAttribute("aria-expanded") === "true") mbtn.click();
    });
  }

  /* ---- scroll reveal (hidden state only exists under html.js; timed fallback) ---- */
  var rvs = [].slice.call(document.querySelectorAll(".rv"));
  // stagger index within parent groups
  rvs.forEach(function (el) {
    var sibs = el.parentElement ? [].slice.call(el.parentElement.children).filter(function (c) { return c.classList.contains("rv"); }) : [];
    var i = sibs.indexOf(el);
    el.style.setProperty("--i", String(Math.min(i < 0 ? 0 : i, 8)));
  });
  function showAll() { rvs.forEach(function (el) { el.classList.add("in"); }); root.classList.add("rv-done"); }
  if (reduce || !("IntersectionObserver" in window)) {
    showAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    rvs.forEach(function (el) { io.observe(el); });
    window.setTimeout(showAll, 2600);
  }

  /* ---- count-up on stat band: placeholder figures tick, then settle on the bracket token ---- */
  var counters = [].slice.call(document.querySelectorAll("[data-count]"));
  function finish(el) { el.textContent = el.getAttribute("data-count"); }
  if (reduce || !("IntersectionObserver" in window)) {
    counters.forEach(finish);
  } else {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target; cio.unobserve(el);
        var n = 0, steps = 14;
        var t = window.setInterval(function () {
          n++;
          var v = Math.min(99, Math.round((n / steps) * 99));
          el.textContent = "[" + (v < 10 ? "0" + v : v) + "]";
          if (n >= steps) { window.clearInterval(t); finish(el); }
        }, 45);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });
    window.setTimeout(function () { counters.forEach(finish); }, 4000);
  }

  /* ---- copy link affordance ---- */
  document.querySelectorAll("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var url = location.href.split("#")[0] + "#" + b.getAttribute("data-copy");
      var label = b.querySelector(".lbl") || b;
      var orig = label.textContent;
      function done(msg) { label.textContent = msg; window.setTimeout(function () { label.textContent = orig; }, 2200); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { done("Link copied"); }, function () { done(url); });
      } else { done(url); }
    });
  });

  /* ---- site-coverage check (DEMO logic: client supplies the real ZIP / county list) ---- */
  var DEMO_IN = ["900", "901", "902"];        // [SERVICE AREA — CONFIRM]
  var DEMO_MULTI = ["903", "904", "905"];     // [MULTI-SITE COVERAGE — CONFIRM]
  document.querySelectorAll("form.cov").forEach(function (f) {
    var input = f.querySelector("input");
    var out = f.querySelector(".cov-out");
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = (input.value || "").trim();
      var html;
      if (!v) {
        html = '<span class="res out">Enter a 5-digit ZIP or a county name.</span>';
        input.focus();
      } else if (/^\d{5}$/.test(v)) {
        var p = v.slice(0, 3);
        if (DEMO_IN.indexOf(p) > -1) html = '<span class="res in">IN COVERAGE (demo) — ' + v + ' sits inside [SERVICE AREA — CONFIRM]. Request a proposal or call dispatch.</span>';
        else if (DEMO_MULTI.indexOf(p) > -1) html = '<span class="res">EDGE OF AREA (demo) — ask us about multi-site coverage for ' + v + '. [COVERAGE TERMS — CONFIRM]</span>';
        else html = '<span class="res out">OUTSIDE LISTED AREA (demo) — ' + v + ' is not on the demo list. Ask us about multi-site coverage.</span>';
      } else if (/^\d+$/.test(v)) {
        html = '<span class="res out">A ZIP code has 5 digits. Try again, or enter a county name.</span>';
      } else {
        html = '<span class="res">COUNTY ENTERED (demo) — "' + v.replace(/[<>&"]/g, "") + '". County coverage is confirmed by the office: [SERVICE AREA — CONFIRM].</span>';
      }
      out.innerHTML = html;
    });
  });

  /* ---- dispatch slip: agreement ref is optional; button places the call ---- */
  document.querySelectorAll("form.dispatch").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var tel = f.getAttribute("data-tel") || "tel:+10000000000";
      var ref = f.querySelector("input");
      var msg = f.querySelector(".dmsg");
      if (msg) msg.textContent = ref && ref.value.trim() ? "Have agreement ref " + ref.value.trim() + " ready when dispatch answers. Dialling… (demo number)" : "Dialling dispatch… (demo number)";
      window.location.href = tel;
    });
  });

  /* ---- prefill proposal form from "Request this scope" / "vendor packet" links ---- */
  function applyIntent(intent, scope) {
    var sel = document.getElementById("p-intent");
    if (sel && intent) sel.value = intent;
    var sc = document.getElementById("p-scope");
    if (sc && scope) sc.value = scope;
  }
  document.querySelectorAll("[data-intent]").forEach(function (a) {
    a.addEventListener("click", function () {
      applyIntent(a.getAttribute("data-intent"), a.getAttribute("data-scope"));
    });
  });
  try {
    var qs = new URLSearchParams(location.search);
    if (qs.get("intent") || qs.get("scope")) applyIntent(qs.get("intent"), qs.get("scope"));
  } catch (err) { /* old browser: no prefill */ }

  /* ---- document upload: filename chips + image previews (nothing is uploaded) ---- */
  var ICON_DOC = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/></svg>';
  var ICON_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  document.querySelectorAll("[data-upload]").forEach(function (wrap) {
    var input = wrap.querySelector('input[type="file"]');
    var list = wrap.querySelector(".fchips");
    var status = wrap.querySelector(".fstatus");
    var files = [];
    var urls = [];
    function render() {
      urls.forEach(function (u) { URL.revokeObjectURL(u); }); urls = [];
      list.innerHTML = "";
      files.forEach(function (f, idx) {
        var li = document.createElement("li");
        var thumb;
        if (/^image\//.test(f.type)) {
          thumb = document.createElement("img");
          var u = URL.createObjectURL(f); urls.push(u);
          thumb.src = u; thumb.alt = "Preview of " + f.name;
        } else {
          thumb = document.createElement("span"); thumb.className = "fic"; thumb.innerHTML = ICON_DOC;
        }
        var nm = document.createElement("span"); nm.className = "fname"; nm.textContent = f.name;
        var kb = document.createElement("span"); kb.textContent = Math.max(1, Math.round(f.size / 1024)) + " KB";
        var rm = document.createElement("button"); rm.type = "button"; rm.setAttribute("aria-label", "Remove " + f.name); rm.innerHTML = ICON_X;
        rm.addEventListener("click", function () { files.splice(idx, 1); render(); input.focus(); });
        li.appendChild(thumb); li.appendChild(nm); li.appendChild(kb); li.appendChild(rm);
        list.appendChild(li);
      });
      if (status) status.textContent = files.length ? files.length + " file" + (files.length > 1 ? "s" : "") + " attached (demo only — no file is stored)" : "";
    }
    input.addEventListener("change", function () {
      [].slice.call(input.files || []).forEach(function (f) { if (files.length < 10) files.push(f); });
      input.value = "";
      render();
    });
    wrap.__files = function () { return files; };
  });

  /* ---- proposal form: validate, then show demo confirmation ---- */
  document.querySelectorAll("form.proposal").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstBad = null;
      f.querySelectorAll("[required]").forEach(function (el) {
        var fld = el.closest(".fld");
        var ok = el.value && el.value.trim() !== "";
        if (ok && el.type === "email") ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
        if (ok && el.type === "tel") ok = el.value.replace(/\D/g, "").length >= 10;
        if (fld) {
          fld.classList.toggle("invalid", !ok);
          var er = fld.querySelector(".err");
          if (er) er.textContent = ok ? "" : (el.getAttribute("data-err") || "Required");
        }
        el.setAttribute("aria-invalid", ok ? "false" : "true");
        if (!ok && !firstBad) firstBad = el;
      });
      if (firstBad) { firstBad.focus(); return; }
      var up = f.querySelector("[data-upload]");
      var n = up && up.__files ? up.__files().length : 0;
      var box = f.querySelector(".confirm");
      var company = (f.querySelector("#p-company") || {}).value || "your organisation";
      box.hidden = false;
      box.querySelector("p").textContent = "DEMO — nothing was sent. In the live site, the proposals desk would receive this request for " + company.replace(/[<>]/g, "") + (n ? " with " + n + " attached document" + (n > 1 ? "s" : "") : "") + " and reply within [RESPONSE TIME — CONFIRM].";
      box.setAttribute("tabindex", "-1");
      box.focus();
    });
  });
})();
