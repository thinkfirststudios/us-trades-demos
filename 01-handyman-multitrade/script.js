/* Nine Yards Home Repair Co. — DEMO TEMPLATE (ThinkFirst Studios). Fictional company.
   Plain JS, no dependencies. Everything here is client-side only: no data leaves the page. */
(function () {
  "use strict";
  window.__nyReady = true; // tells the <head> fallback that JS is running

  var doc = document.documentElement;
  var reduceMQ = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  function reduced() { return !!reduceMQ.matches; }

  /* ------------------------------------------------------------------
     Service-area lookup.  [ZIP LIST — CONFIRM]
     Demo values only — deliberately NOT real ZIP codes. Replace with the
     client's confirmed list before launch.
     ------------------------------------------------------------------ */
  var SERVICE_ZIPS = [
    "00001", "00002", "00003", "00004", "00005", "00006",
    "00007", "00008", "00009", "00010", "00011", "00012"
  ];
  var PHONE_DISPLAY = "[(555) 555-0100]";
  var PHONE_TEL = "tel:+15555550100";

  /* ---------- Header condense + sticky call bar ---------- */
  var header = document.querySelector("[data-header]");
  var callbar = document.querySelector("[data-callbar]");
  var ticking = false;
  function onScroll() {
    var y = window.pageYOffset || doc.scrollTop;
    if (header) header.classList.toggle("is-condensed", y > 60);
    if (callbar) callbar.classList.toggle("is-on", y > 400);
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector("[data-menu-toggle]");
  var mnav = document.getElementById("mobile-nav");
  if (toggle && mnav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Open menu" : "Close menu");
      mnav.hidden = open;
    });
    mnav.addEventListener("click", function (e) {
      if (e.target.closest("a")) { toggle.setAttribute("aria-expanded", "false"); toggle.setAttribute("aria-label", "Open menu"); mnav.hidden = true; }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !mnav.hidden) { mnav.hidden = true; toggle.setAttribute("aria-expanded", "false"); toggle.setAttribute("aria-label", "Open menu"); toggle.focus(); }
    });
  }

  /* ---------- Scroll reveal (70ms stagger within a group) ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
  document.querySelectorAll("[data-reveal-group]").forEach(function (group) {
    group.querySelectorAll("[data-reveal]").forEach(function (el, i) {
      el.style.setProperty("--d", (i * 70) + "ms");
    });
  });
  if (!("IntersectionObserver" in window) || reduced()) {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-in"); io.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0 });
    revealEls.forEach(function (el) { io.observe(el); });
    // Safety net: never leave content hidden.
    window.addEventListener("load", function () {
      setTimeout(function () {
        revealEls.forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0) el.classList.add("is-in");
        });
      }, 400);
    });
  }

  /* ---------- Count-up (brackets are static; only digits animate) ---------- */
  function fmt(n, comma) { return comma ? n.toLocaleString("en-US") : String(n); }
  var counters = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));
  function runCount(el) {
    var to = parseInt(el.getAttribute("data-count"), 10) || 0;
    var comma = el.hasAttribute("data-comma");
    if (reduced()) { el.textContent = fmt(to, comma); return; }
    var start = null, dur = 900;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(to * eased), comma);
      if (p < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }
  if (counters.length) {
    if (!("IntersectionObserver" in window) || reduced()) {
      counters.forEach(function (el) { el.textContent = fmt(parseInt(el.getAttribute("data-count"), 10) || 0, el.hasAttribute("data-comma")); });
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { runCount(entry.target); cio.unobserve(entry.target); }
        });
      }, { rootMargin: "0px 0px -10% 0px" });
      counters.forEach(function (el) {
        el.textContent = fmt(0, el.hasAttribute("data-comma"));
        cio.observe(el);
      });
    }
  }

  /* ---------- Accordions ---------- */
  document.querySelectorAll("[data-acc]").forEach(function (acc) {
    var single = acc.hasAttribute("data-acc-single");
    acc.querySelectorAll(".acc__btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item = btn.closest(".acc__item");
        var open = item.classList.contains("is-open");
        if (single && !open) {
          acc.querySelectorAll(".acc__item.is-open").forEach(function (o) {
            o.classList.remove("is-open");
            o.querySelector(".acc__btn").setAttribute("aria-expanded", "false");
          });
        }
        item.classList.toggle("is-open", !open);
        btn.setAttribute("aria-expanded", String(!open));
      });
    });
  });

  /* ---------- ZIP / service-area checker ---------- */
  var ICON_IN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';
  var ICON_OUT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>';
  document.querySelectorAll("[data-zip]").forEach(function (form) {
    var input = form.querySelector("input");
    var out = form.querySelector("[data-zip-result]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = (input.value || "").replace(/\D/g, "").slice(0, 5);
      if (v.length !== 5) {
        out.innerHTML = '<div class="zip__state zip__state--err">Enter a 5-digit ZIP code.</div>';
        input.focus();
        return;
      }
      if (SERVICE_ZIPS.indexOf(v) !== -1) {
        out.innerHTML = '<div class="zip__state zip__state--in">' + ICON_IN +
          '<span><strong>' + v + ' is in our area.</strong> Send a photo or call for a number — <span class="ph">[SAME-DAY AVAILABILITY — CONFIRM]</span>.</span></div>';
      } else {
        out.innerHTML = '<div class="zip__state zip__state--out">' + ICON_OUT +
          '<span><strong>' + v + ' is just outside our list — call us.</strong> We sometimes travel <span class="ph">[CONFIRM]</span>. <a href="' + PHONE_TEL + '">' + PHONE_DISPLAY + '</a></span></div>';
      }
    });
  });

  /* ---------- Photo drop zone (previews only, never uploaded) ---------- */
  var X_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  document.querySelectorAll("[data-drop]").forEach(function (drop) {
    var input = drop.querySelector('input[type="file"]');
    var list = drop.querySelector("[data-thumbs]");
    var files = [];
    function render() {
      list.innerHTML = "";
      files.forEach(function (f, i) {
        var li = document.createElement("li");
        var img = document.createElement("img");
        img.alt = "Preview of " + f.name;
        img.src = URL.createObjectURL(f);
        img.onload = function () { URL.revokeObjectURL(img.src); };
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", "Remove " + f.name);
        b.innerHTML = X_ICON;
        b.addEventListener("click", function () { files.splice(i, 1); render(); });
        li.appendChild(img); li.appendChild(b); list.appendChild(li);
      });
    }
    function add(fileList) {
      Array.prototype.forEach.call(fileList, function (f) {
        if (f.type && f.type.indexOf("image/") === 0 && files.length < 8) files.push(f);
      });
      render();
    }
    input.addEventListener("change", function () { add(input.files); input.value = ""; });
    ["dragenter", "dragover"].forEach(function (t) {
      drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add("is-over"); });
    });
    ["dragleave", "drop"].forEach(function (t) {
      drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove("is-over"); });
    });
    drop.addEventListener("drop", function (e) { if (e.dataTransfer && e.dataTransfer.files) add(e.dataTransfer.files); });
    drop._reset = function () { files = []; render(); };
  });

  /* ---------- Quote forms (client-side demo only) ---------- */
  document.querySelectorAll("[data-quote-form]").forEach(function (form) {
    var card = form.closest("[data-form-card]");
    form.addEventListener("input", function (e) {
      var wrap = e.target.closest ? e.target.closest(".field.has-error") : null;
      if (wrap && e.target.value.trim()) { wrap.classList.remove("has-error"); e.target.setAttribute("aria-invalid", "false"); }
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstBad = null;
      form.querySelectorAll("[required]").forEach(function (field) {
        var wrap = field.closest(".field");
        var ok = field.value.trim().length > 0;
        if (ok && field.name === "zip") ok = /^\d{5}$/.test(field.value.trim());
        if (wrap) wrap.classList.toggle("has-error", !ok);
        field.setAttribute("aria-invalid", ok ? "false" : "true");
        if (!ok && !firstBad) firstBad = field;
      });
      if (firstBad) { firstBad.focus(); return; }
      if (card) {
        card.classList.add("is-sent");
        var done = card.querySelector(".form-done");
        if (done) { done.setAttribute("tabindex", "-1"); done.focus(); }
      }
    });
    var again = card ? card.querySelector("[data-form-reset]") : null;
    if (again) {
      again.addEventListener("click", function () {
        form.reset();
        form.querySelectorAll(".has-error").forEach(function (w) { w.classList.remove("has-error"); });
        var d = form.querySelector("[data-drop]");
        if (d && d._reset) d._reset();
        card.classList.remove("is-sent");
        var first = form.querySelector("input, textarea");
        if (first) first.focus();
      });
    }
  });
})();
