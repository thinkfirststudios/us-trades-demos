/* Wayside Charge Works: DEMO TEMPLATE 13. Fictional company. Client-side only; nothing is sent anywhere. */
(function () {
  "use strict";
  var doc = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasIO = "IntersectionObserver" in window;

  /* ---------- reveal (hidden state only exists once JS has added the class) ---------- */
  var reveals = [].slice.call(document.querySelectorAll(".reveal"));
  if (!reduce && hasIO && reveals.length) {
    doc.classList.add("js-reveal");
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); rio.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { rio.observe(el); });
    // timed fallback: nothing stays hidden if the observer never fires
    setTimeout(function () { reveals.forEach(function (el) { el.classList.add("is-in"); }); }, 2600);
  }

  /* ---------- drawn diagrams (panel, levels, site plan) ---------- */
  var drawn = [].slice.call(document.querySelectorAll(".dia, .levels, .plan"));
  if (!reduce && hasIO && drawn.length) {
    doc.classList.add("js-anim");
    var dio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-drawn"); dio.unobserve(e.target); }
      });
    }, { threshold: 0.3 });
    drawn.forEach(function (el) { dio.observe(el); });
    setTimeout(function () { drawn.forEach(function (el) { el.classList.add("is-drawn"); }); }, 4000);
  } else {
    drawn.forEach(function (el) { el.classList.add("is-drawn"); });
  }

  /* ---------- stat row: digits roll, then resolve to the bracketed placeholder ---------- */
  var stats = [].slice.call(document.querySelectorAll("[data-roll]"));
  function roll(el) {
    var final = el.getAttribute("data-roll");
    var n = (final.match(/N/g) || []).length || 2;
    var t0 = null, dur = 900;
    function frame(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      if (p < 1) {
        var v = Math.floor(p * Math.pow(10, n));
        var s = String(v); while (s.length < n) s = "0" + s;
        el.textContent = "[" + s + "]";
        requestAnimationFrame(frame);
      } else { el.textContent = final; }
    }
    requestAnimationFrame(frame);
    // make sure the placeholder is what stays on screen, even if frames are throttled
    setTimeout(function () { el.textContent = final; }, dur + 250);
  }
  if (!reduce && hasIO && stats.length) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { roll(e.target); sio.unobserve(e.target); } });
    }, { threshold: 0.6 });
    stats.forEach(function (el) { sio.observe(el); });
  } else {
    stats.forEach(function (el) { el.textContent = el.getAttribute("data-roll"); });
  }

  /* ---------- condensing header ---------- */
  var hd = document.querySelector(".hd");
  if (hd) {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        // hysteresis: the header shrinks by ~22px, so a single threshold would oscillate with scroll anchoring
        var y = window.scrollY, on = hd.classList.contains("is-condensed");
        if (!on && y > 90) hd.classList.add("is-condensed");
        else if (on && y < 16) hd.classList.remove("is-condensed");
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }

  /* ---------- mobile menu ---------- */
  var mbtn = document.querySelector(".menu-btn"), mnav = document.getElementById("mnav");
  if (mbtn && mnav) {
    var setMenu = function (open) {
      mnav.classList.toggle("is-open", open);
      mbtn.setAttribute("aria-expanded", open ? "true" : "false");
      mbtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      mbtn.querySelector(".i-open").style.display = open ? "none" : "";
      mbtn.querySelector(".i-close").style.display = open ? "" : "none";
    };
    mbtn.addEventListener("click", function () { setMenu(mnav.className.indexOf("is-open") < 0); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && mnav.classList.contains("is-open")) { setMenu(false); mbtn.focus(); } });
    mnav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  }

  /* ---------- "Send a photo of your panel": scroll to the form, focus the panel upload ---------- */
  function focusPanelUpload() {
    var f = document.querySelector("[data-panel-upload]");
    if (!f) return false;
    var sec = document.getElementById("quote");
    if (sec) sec.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    setTimeout(function () { f.focus({ preventScroll: true }); }, reduce ? 0 : 450);
    return true;
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[href$='#quote']");
    if (!a) return;
    var url = new URL(a.href, location.href);
    if (url.pathname === location.pathname && focusPanelUpload()) {
      e.preventDefault();
      if (history.replaceState) history.replaceState(null, "", "#quote");
    }
  });
  if (location.hash === "#quote") setTimeout(focusPanelUpload, 60);

  /* ---------- service-area check (demo list only) ---------- */
  var DEMO_ZIPS = ["12345", "12346", "12347", "12348"];
  [].forEach.call(document.querySelectorAll("form.zip-form"), function (form) {
    var input = form.querySelector("input"), out = form.parentNode.querySelector(".zip-out"), err = form.querySelector(".field-err");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = (input.value || "").trim();
      out.textContent = ""; out.removeAttribute("data-state");
      if (!/^\d{5}$/.test(v)) {
        err.textContent = "Enter a 5-digit ZIP code.";
        input.setAttribute("aria-invalid", "true"); input.focus(); return;
      }
      err.textContent = ""; input.removeAttribute("aria-invalid");
      var photoHref = document.getElementById("quote") ? "#quote" : "contact.html#quote";
      if (DEMO_ZIPS.indexOf(v) > -1) {
        out.setAttribute("data-state", "in");
        out.innerHTML = "<strong>" + v + " is inside the demo service area.</strong> Next step: <a href=\"" + photoHref + "\">send a photo of your panel</a>.";
      } else {
        out.setAttribute("data-state", "out");
        out.innerHTML = "<strong>" + v + " isn't on the demo list.</strong> Call <a href=\"tel:+10000000000\">[PHONE — CONFIRM]</a> to check. Edge-of-area policy: <span class=\"tk\">[CONFIRM]</span>";
      }
    });
  });

  /* ---------- uploads: filename chips + image previews (nothing is stored) ---------- */
  var ICON_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var ICON_DOC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 15.5h5"/></svg>';
  [].forEach.call(document.querySelectorAll(".drop input[type=file]"), function (input) {
    var drop = input.closest(".drop");
    var list = document.getElementById(input.getAttribute("data-chips"));
    var store = [];
    function render() {
      list.innerHTML = "";
      store.forEach(function (file, i) {
        var li = document.createElement("li");
        var thumb;
        if (/^image\//.test(file.type)) {
          thumb = document.createElement("img"); thumb.alt = ""; thumb.src = URL.createObjectURL(file);
          thumb.onload = function () { URL.revokeObjectURL(thumb.src); };
        } else { thumb = document.createElement("span"); thumb.className = "doc"; thumb.innerHTML = ICON_DOC; }
        var nm = document.createElement("span"); nm.className = "nm"; nm.textContent = file.name;
        var b = document.createElement("button"); b.type = "button"; b.innerHTML = ICON_X;
        b.setAttribute("aria-label", "Remove " + file.name);
        b.addEventListener("click", function () { store.splice(i, 1); render(); input.focus(); });
        li.appendChild(thumb); li.appendChild(nm); li.appendChild(b); list.appendChild(li);
      });
      input._files = store;
    }
    input.addEventListener("change", function () {
      [].forEach.call(input.files || [], function (f) { if (store.length < 6) store.push(f); });
      input.value = ""; render();
    });
    ["dragenter", "dragover"].forEach(function (t) { drop.addEventListener(t, function () { drop.classList.add("is-over"); }); });
    ["dragleave", "drop"].forEach(function (t) { drop.addEventListener(t, function () { drop.classList.remove("is-over"); }); });
    input._files = store;
  });

  /* ---------- forms: validate, then show the demo confirmation ---------- */
  [].forEach.call(document.querySelectorAll("form[data-demo-form]"), function (form) {
    form.setAttribute("novalidate", "");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var first = null;
      [].forEach.call(form.querySelectorAll("[required]"), function (f) {
        var err = document.getElementById(f.id + "-err");
        var v = (f.value || "").trim(), msg = "";
        if (!v) msg = "Required.";
        else if (f.type === "tel" && v.replace(/\D/g, "").length < 10) msg = "Enter a 10-digit phone number.";
        else if (f.getAttribute("data-zip") !== null && !/^\d{5}$/.test(v)) msg = "Enter a 5-digit ZIP code.";
        else if (f.type === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) msg = "Enter an email address.";
        if (err) err.textContent = msg;
        if (msg) { f.setAttribute("aria-invalid", "true"); if (!first) first = f; } else { f.removeAttribute("aria-invalid"); }
      });
      if (first) { first.focus(); return; }
      var files = 0;
      [].forEach.call(form.querySelectorAll("input[type=file]"), function (i) { files += (i._files || []).length; });
      var done = document.getElementById(form.getAttribute("data-done"));
      var fc = done.querySelector("[data-filecount]");
      if (fc) fc.textContent = files ? files + " file" + (files > 1 ? "s were" : " was") + " attached and discarded; nothing was uploaded." : "No files were attached.";
      form.hidden = true; done.classList.add("is-shown"); done.setAttribute("tabindex", "-1"); done.focus();
    });
  });
  [].forEach.call(document.querySelectorAll("[data-reset]"), function (b) {
    b.addEventListener("click", function () {
      var done = b.closest(".form-done"), form = document.querySelector("form[data-done='" + done.id + "']");
      form.reset(); [].forEach.call(form.querySelectorAll(".chips"), function (c) { c.innerHTML = ""; });
      [].forEach.call(form.querySelectorAll("input[type=file]"), function (i) { if (i._files) i._files.length = 0; });
      done.classList.remove("is-shown"); form.hidden = false; form.querySelector("input,select,textarea").focus();
    });
  });

  /* ---------- FAIL GATE: incentive slots must still carry the verification token ---------- */
  var INCENTIVE_TOKEN = "[INCENTIVE — VERIFY CURRENT FEDERAL, STATE AND UTILITY STATUS AT BUILD TIME]";
  [].forEach.call(document.querySelectorAll(".incentive-slot"), function (slot) {
    var t = (slot.textContent || "").replace(/\s+/g, " ").trim();
    if (t !== INCENTIVE_TOKEN || slot.getAttribute("data-verify") !== "required") {
      console.warn("INCENTIVE SLOT MODIFIED — VERIFICATION REQUIRED", slot);
    }
  });
})();
