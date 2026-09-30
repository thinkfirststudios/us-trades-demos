/* Ninebark Pest Co. — DEMO TEMPLATE 10. Plain JS, no dependencies.
   Motion character: decisive and short. Every effect below has a reduced-motion path. */
(function () {
  "use strict";
  var doc = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  doc.classList.remove("no-js");

  /* ---------- Scroll reveal (hidden state only exists once JS has added .js-reveal) ---------- */
  var reveals = [].slice.call(document.querySelectorAll(".reveal"));
  function showAll() { reveals.forEach(function (el) { el.classList.add("is-in"); }); }
  if (!reduce && "IntersectionObserver" in window && reveals.length) {
    doc.classList.add("js-reveal");
    // stagger index within each group
    [].forEach.call(document.querySelectorAll("[data-stagger]"), function (group) {
      [].forEach.call(group.querySelectorAll(":scope > .reveal"), function (el, i) { el.style.setProperty("--i", i); });
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -4% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
    // timed fallback: nothing stays hidden if the observer never fires
    window.setTimeout(showAll, 2600);
  } else {
    showAll();
  }

  /* ---------- Count-up (brackets stay visible; only the digits animate) ---------- */
  function fmt(n, sep) { var s = String(Math.round(n)); return sep ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : s; }
  var counters = [].slice.call(document.querySelectorAll("[data-count]"));
  function runCount(el) {
    var end = parseFloat(el.getAttribute("data-count")) || 0, sep = el.hasAttribute("data-sep");
    if (reduce) { el.textContent = fmt(end, sep); return; }
    var t0 = null, dur = 900;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(end * eased, sep);
      if (p < 1) window.requestAnimationFrame(step);
    }
    el.textContent = "0";
    window.requestAnimationFrame(step);
  }
  if (counters.length) {
    if (reduce || !("IntersectionObserver" in window)) {
      counters.forEach(function (el) { el.textContent = fmt(parseFloat(el.getAttribute("data-count")) || 0, el.hasAttribute("data-sep")); });
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); } });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { cio.observe(el); });
    }
  }

  /* ---------- Condensing header at 80px ---------- */
  var mast = document.querySelector("[data-masthead]");
  if (mast) {
    var ticking = false;
    var onScroll = function () {
      ticking = false;
      mast.classList.toggle("is-condensed", window.scrollY > 80);
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
  }

  /* ---------- Mobile menu ---------- */
  var menuBtn = document.querySelector("[data-menu]");
  var mnav = document.getElementById("mnav");
  function setMenu(open) {
    if (!menuBtn || !mnav) return;
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mnav.hidden = !open;
    if (mast) mast.classList.toggle("menu-open", open);
  }
  if (menuBtn && mnav) {
    menuBtn.addEventListener("click", function () { setMenu(menuBtn.getAttribute("aria-expanded") !== "true"); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menuBtn.getAttribute("aria-expanded") === "true") { setMenu(false); menuBtn.focus(); }
    });
    [].forEach.call(mnav.querySelectorAll("a"), function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    window.addEventListener("resize", function () { if (window.innerWidth >= 1100) setMenu(false); });
  }

  /* ---------- Service-area ZIP check (demo logic, no real ZIP data) ---------- */
  var ZIP_STATES = {
    "in":   { title: "[IN-AREA MESSAGE — CONFIRM]", body: "[e.g. confirmation that this ZIP is inside the regular service area — CONFIRM]" },
    "edge": { title: "[EDGE-OF-AREA MESSAGE — CONFIRM]", body: "[e.g. this ZIP is at the edge of the area — please call to check — CONFIRM]" },
    "out":  { title: "[OUTSIDE-AREA MESSAGE — CONFIRM]", body: "[e.g. this ZIP is outside the service area — CONFIRM]" }
  };
  [].forEach.call(document.querySelectorAll("[data-zipcheck]"), function (form) {
    var input = form.querySelector("input");
    var err = form.parentNode.querySelector(".err");
    var out = form.parentNode.querySelector(".zip-result");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = (input.value || "").trim();
      if (!/^\d{5}$/.test(v)) {
        input.setAttribute("aria-invalid", "true");
        err.textContent = "Enter a 5-digit ZIP code.";
        if (out) out.hidden = true;
        input.focus();
        return;
      }
      input.removeAttribute("aria-invalid");
      err.textContent = "";
      var d = parseInt(v.charAt(4), 10);
      var key = d <= 5 ? "in" : (d <= 7 ? "edge" : "out");
      var st = ZIP_STATES[key];
      out.className = "zip-result " + key;
      out.innerHTML = "";
      var strong = document.createElement("strong"); strong.textContent = st.title;
      var span = document.createElement("span"); span.textContent = st.body;
      var note = document.createElement("span"); note.className = "demo-note";
      note.textContent = "Demo only — the result is simulated from the last digit. No real ZIP data is used.";
      out.appendChild(strong); out.appendChild(span); out.appendChild(note);
      if (key !== "out") {
        var call = document.createElement("a");
        call.href = "tel:+10000000000"; call.className = "link-arrow"; call.innerHTML = "Call [PHONE — CONFIRM] <span aria-hidden=\"true\">→</span>";
        out.appendChild(call);
      }
      out.hidden = false;
    });
  });

  /* ---------- Photo upload previews ---------- */
  function wireUpload(form) {
    var file = form.querySelector("input[type=file]");
    var list = form.querySelector(".previews");
    if (!file || !list) return;
    var store = [];
    var urls = [];
    function render() {
      urls.forEach(function (u) { URL.revokeObjectURL(u); }); urls = [];
      list.innerHTML = "";
      store.forEach(function (f, i) {
        var li = document.createElement("li");
        if (/^image\//.test(f.type)) {
          var img = document.createElement("img"); var u = URL.createObjectURL(f); urls.push(u);
          img.src = u; img.alt = "Preview of " + f.name; li.appendChild(img);
        }
        var n = document.createElement("span"); n.className = "fname"; n.textContent = f.name; li.appendChild(n);
        var b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-label", "Remove " + f.name);
        b.innerHTML = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>';
        b.addEventListener("click", function () { store.splice(i, 1); render(); file.focus(); });
        li.appendChild(b);
        list.appendChild(li);
      });
      var status = form.querySelector(".upload-status");
      if (status) status.textContent = store.length ? store.length + (store.length === 1 ? " photo attached." : " photos attached.") : "";
    }
    form._clearUploads = function () { store = []; render(); };
    file.addEventListener("change", function () {
      [].forEach.call(file.files || [], function (f) {
        if (/^image\//.test(f.type) && store.length < 4) store.push(f);
      });
      file.value = "";
      render();
    });
  }

  /* ---------- Quote / inspection forms (client-side only) ---------- */
  var RULES = {
    name: function (v) { return v.trim().length >= 2 ? "" : "Enter your name."; },
    phone: function (v) { return v.replace(/\D/g, "").length >= 10 ? "" : "Enter a phone number with area code."; },
    zip: function (v) { return /^\d{5}$/.test(v.trim()) ? "" : "Enter a 5-digit ZIP code."; },
    email: function (v) { return !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Check the email address."; },
    pest: function (v) { return v ? "" : "Choose what you're seeing."; }
  };
  [].forEach.call(document.querySelectorAll("[data-quote]"), function (form) {
    wireUpload(form);
    var done = form.parentNode.querySelector(".form-done");
    function check(el) {
      var rule = RULES[el.getAttribute("data-rule")];
      if (!rule) return "";
      var msg = rule(el.value || "");
      var errEl = document.getElementById(el.id + "-err");
      if (msg) { el.setAttribute("aria-invalid", "true"); } else { el.removeAttribute("aria-invalid"); }
      if (errEl) errEl.textContent = msg;
      return msg;
    }
    [].forEach.call(form.querySelectorAll("[data-rule]"), function (el) {
      el.addEventListener("blur", function () { if (el.value) check(el); });
      el.addEventListener("input", function () { if (el.getAttribute("aria-invalid") === "true") check(el); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var first = null;
      [].forEach.call(form.querySelectorAll("[data-rule]"), function (el) { if (check(el) && !first) first = el; });
      if (first) { first.focus(); return; }
      form.hidden = true;
      if (done) {
        done.hidden = false;
        var h = done.querySelector("h3, h2");
        if (h) { h.setAttribute("tabindex", "-1"); h.focus(); }
      }
    });
    if (done) {
      var again = done.querySelector("[data-reset]");
      if (again) again.addEventListener("click", function () {
        form.reset();
        if (form._clearUploads) form._clearUploads();
        done.hidden = true; form.hidden = false;
        var f = form.querySelector("input"); if (f) f.focus();
      });
    }
  });

  /* ---------- Pest preselect from ?pest= ---------- */
  var sel = document.querySelector("[data-pest-select]");
  if (sel && window.URLSearchParams) {
    var want = new URLSearchParams(window.location.search).get("pest");
    if (want && sel.querySelector('option[value="' + want.replace(/[^a-z]/g, "") + '"]')) sel.value = want;
  }

  /* ---------- FAQ accordion ---------- */
  [].forEach.call(document.querySelectorAll(".faq-q"), function (btn) {
    var panel = document.getElementById(btn.getAttribute("aria-controls"));
    if (!panel) return;
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", open ? "false" : "true");
      if (open) {
        panel.style.height = panel.scrollHeight + "px";
        panel.offsetHeight; // reflow
        panel.style.height = "0px";
        window.setTimeout(function () { panel.hidden = true; }, reduce ? 0 : 200);
      } else {
        panel.hidden = false;
        panel.style.height = "0px";
        panel.offsetHeight;
        panel.style.height = panel.scrollHeight + "px";
        window.setTimeout(function () { if (btn.getAttribute("aria-expanded") === "true") panel.style.height = "auto"; }, reduce ? 0 : 210);
      }
    });
  });

  /* ---------- pests.html: in-page nav highlights the section in view ---------- */
  var pnav = document.querySelector("[data-pest-nav]");
  if (pnav && "IntersectionObserver" in window) {
    var links = {};
    [].forEach.call(pnav.querySelectorAll("a"), function (a) { links[a.getAttribute("href").slice(1)] = a; });
    var current = null;
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          if (current) { current.classList.remove("is-active"); current.removeAttribute("aria-current"); }
          current = links[e.target.id];
          if (current) {
            current.classList.add("is-active"); current.setAttribute("aria-current", "true");
            var ul = pnav.querySelector("ul");
            if (ul && ul.scrollWidth > ul.clientWidth) ul.scrollTo({ left: current.offsetLeft - 16, behavior: reduce ? "auto" : "smooth" });
          }
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) sio.observe(s); });
    var firstSec = document.getElementById(Object.keys(links)[0]);
    window.addEventListener("scroll", function () {
      if (current && firstSec && firstSec.getBoundingClientRect().top > window.innerHeight * 0.45) {
        current.classList.remove("is-active"); current.removeAttribute("aria-current"); current = null;
      }
    }, { passive: true });
  }

  /* ---------- Footer year ---------- */
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();
