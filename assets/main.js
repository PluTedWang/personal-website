(function () {
  "use strict";

  /* ---------- Theme ---------- */
  var root = document.documentElement;
  var stored = null;
  try { stored = localStorage.getItem("theme"); } catch (e) { /* ignore */ }
  if (stored === "dark" || stored === "light") root.setAttribute("data-theme", stored);

  function currentIsDark() {
    var attr = root.getAttribute("data-theme");
    if (attr === "dark") return true;
    if (attr === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function initThemeToggle() {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var next = currentIsDark() ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) { /* ignore */ }
    });
  }

  /* ---------- Nav scroll state ---------- */
  function initNav() {
    var nav = document.getElementById("nav");
    if (!nav) return;
    var wrap = nav.parentElement;
    function onScroll() {
      if (window.scrollY > 24) wrap.classList.add("scrolled");
      else wrap.classList.remove("scrolled");
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Figma live canvas (loaded on demand) ---------- */
  function initFigmaEmbeds() {
    var medias = document.querySelectorAll(".figma-media[data-embed]");
    medias.forEach(function (box) {
      var btn = box.querySelector(".figma-play");
      if (!btn) return;
      btn.addEventListener("click", function () {
        var src = box.getAttribute("data-embed");
        if (!src) return;
        var iframe = document.createElement("iframe");
        iframe.setAttribute("src", src);
        iframe.setAttribute("allowfullscreen", "");
        iframe.setAttribute("title", "Live Figma canvas");
        iframe.setAttribute("loading", "lazy");
        box.innerHTML = "";
        box.appendChild(iframe);
        box.classList.add("live");
      });
    });
  }

  /* ---------- Hero parallax (pointer-driven, eased) ---------- */
  function initParallax() {
    var el = document.querySelector("[data-parallax]");
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return;
    var layers = Array.prototype.slice.call(el.querySelectorAll("[data-depth]"));
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;

    function onMove(e) {
      var r = el.getBoundingClientRect();
      tx = (e.clientX - (r.left + r.width / 2)) / r.width;
      ty = (e.clientY - (r.top + r.height / 2)) / r.height;
      if (!raf) raf = requestAnimationFrame(tick);
    }
    function onLeave() { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(tick); }
    function tick() {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      layers.forEach(function (l) {
        var d = parseFloat(l.getAttribute("data-depth")) || 1;
        var rot = parseFloat(l.getAttribute("data-rot")) || 0;
        l.style.transform = "rotate(" + rot + "deg) translate3d(" + (cx * 22 * d).toFixed(2) + "px," + (cy * 18 * d).toFixed(2) + "px,0)";
      });
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) raf = requestAnimationFrame(tick);
      else raf = null;
    }
    window.addEventListener("mousemove", onMove, { passive: true });
    el.addEventListener("mouseleave", onLeave);
  }

  /* ---------- Card tilt + sheen ---------- */
  function initTilt() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return;
    var cards = document.querySelectorAll("[data-tilt]");
    cards.forEach(function (card) {
      var raf = null, rx = 0, ry = 0, px = 50, py = 50;
      function onMove(e) {
        var r = card.getBoundingClientRect();
        var dx = (e.clientX - r.left) / r.width - 0.5;
        var dy = (e.clientY - r.top) / r.height - 0.5;
        ry = dx * 5;
        rx = -dy * 5;
        px = (e.clientX - r.left) / r.width * 100;
        py = (e.clientY - r.top) / r.height * 100;
        if (!raf) raf = requestAnimationFrame(apply);
      }
      function apply() {
        card.style.transform = "perspective(1000px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg) translateY(-6px)";
        card.style.setProperty("--mx", px.toFixed(1) + "%");
        card.style.setProperty("--my", py.toFixed(1) + "%");
        raf = null;
      }
      function onLeave() {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        card.style.transform = "";
      }
      card.addEventListener("mousemove", onMove, { passive: true });
      card.addEventListener("mouseleave", onLeave);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initThemeToggle();
    initNav();
    initReveal();
    initFigmaEmbeds();
    initParallax();
    initTilt();
  });
})();
