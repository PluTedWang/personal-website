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

  document.addEventListener("DOMContentLoaded", function () {
    initThemeToggle();
    initNav();
    initReveal();
    initFigmaEmbeds();
  });
})();
