(function () {
  "use strict";

  /* ---------- Theme ---------- */
  var root = document.documentElement;
  var stored = null;
  try { stored = localStorage.getItem("theme"); } catch (e) { /* ignore */ }
  if (stored === "dark" || stored === "light") {
    root.setAttribute("data-theme", stored);
  }

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
    function onScroll() {
      if (window.scrollY > 24) nav.classList.add("scrolled");
      else nav.classList.remove("scrolled");
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
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Hero network canvas ---------- */
  function initNetworkCanvas() {
    var canvas = document.getElementById("network");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var points = [];
    var mouse = { x: -9999, y: -9999 };
    var raf = null;

    function sizeCanvas() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      points = [];
      for (var i = 0; i < 26; i++) {
        points.push({
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.18,
          r: Math.random() * 1.4 + 1,
        });
      }
    }

    function onMove(e) {
      var rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }
    function onLeave() {
      mouse.x = -9999;
      mouse.y = -9999;
    }

    function draw() {
      var rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      var dark = currentIsDark();
      var lineColor = dark ? "122,151,255" : "74,114,255";
      var dotColor = dark ? "150,170,255" : "74,114,255";

      for (var i = 0; i < points.length; i++) {
        var p = points[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > rect.width) p.vx *= -1;
        if (p.y < 0 || p.y > rect.height) p.vy *= -1;
        var dx = mouse.x - p.x, dy = mouse.y - p.y;
        var d = Math.hypot(dx, dy);
        if (d < 120) {
          p.x -= dx * 0.0015;
          p.y -= dy * 0.0015;
        }
      }

      for (var a = 0; a < points.length; a++) {
        for (var b = a + 1; b < points.length; b++) {
          var pa = points[a], pb = points[b];
          var dd = Math.hypot(pa.x - pb.x, pa.y - pb.y);
          if (dd < 125) {
            ctx.strokeStyle = "rgba(" + lineColor + "," + (1 - dd / 125) * 0.14 + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
            ctx.stroke();
          }
        }
      }

      for (var j = 0; j < points.length; j++) {
        var pt = points[j];
        ctx.fillStyle = "rgba(" + dotColor + ",.36)";
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    sizeCanvas();
    window.addEventListener("resize", sizeCanvas);
    var parent = canvas.parentElement;
    if (parent) {
      parent.addEventListener("mousemove", onMove);
      parent.addEventListener("mouseleave", onLeave);
    }

    if (reduceMotion) {
      draw();
      if (raf) cancelAnimationFrame(raf);
    } else {
      draw();
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initThemeToggle();
    initNav();
    initReveal();
    initNetworkCanvas();
  });
})();
