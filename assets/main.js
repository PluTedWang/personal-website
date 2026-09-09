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


  /* ---------- Newton's cradle: pointer driven simulation ---------- */
  function initCradle() {
    var root = document.querySelector(".cradle");
    if (!root) return;
    var pends = Array.prototype.slice.call(root.querySelectorAll(".pend"));
    var N = pends.length;
    if (!N) return;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var a = 0;          // pendulum angle in radians; positive = swung out to the left
    var v = 0;          // angular velocity
    var k = 1;          // how many balls are in the moving group
    var holding = false;
    var holdTarget = 0;
    var idleTimer = 0;
    var lastT = 0;
    var G = 9.81, L = 2.4;              // metres; sets the tempo
    var HOLD = 30 * Math.PI / 180;      // lift angle while the pointer is held
    var REST = 0.985;                   // energy kept through each collision
    var AIR = 0.9985;                   // air drag per frame

    function render() {
      for (var i = 0; i < N; i++) {
        var deg = 0;
        if (a > 0 && i < k) deg = a * 180 / Math.PI;            // left group is out
        else if (a < 0 && i >= N - k) deg = a * 180 / Math.PI;  // right group is out
        pends[i].style.transform = "rotate(" + deg.toFixed(3) + "deg)";
      }
    }

    function kick(count, angleDeg) {
      k = Math.max(1, Math.min(N - 1, count));
      a = angleDeg * Math.PI / 180;
      v = 0;
    }

    function step(t) {
      var dt = lastT ? Math.min(0.032, (t - lastT) / 1000) : 0.016;
      lastT = t;
      if (holding) {
        a += (holdTarget - a) * Math.min(1, dt * 12);   // ease up to the hold angle
        v = 0;
      } else {
        var prev = a;
        var acc = -(G / L) * Math.sin(a);
        v += acc * dt;
        v *= AIR;
        a += v * dt;
        if ((prev > 0 && a <= 0) || (prev < 0 && a >= 0)) {
          v *= REST;                                    // the click: energy crosses the row
          root.classList.add("hit");
          setTimeout(function () { root.classList.remove("hit"); }, 90);
        }
        if (Math.abs(a) < 0.004 && Math.abs(v) < 0.02) { a = 0; v = 0; idleTimer += dt; }
        else idleTimer = 0;
        if (!reduce && idleTimer > 2.2) { kick(1, 26); idleTimer = 0; }
      }
      render();
      requestAnimationFrame(step);
    }

    // Which gap is the pointer in? Returns how many balls sit to its left (1..N-1).
    function gapFor(clientX) {
      var r = root.querySelector(".cradle-row").getBoundingClientRect();
      var x = (clientX - r.left) / r.width;           // 0..1 across the row
      var g = Math.round(x * N);                       // gap index 0..N
      return Math.max(1, Math.min(N - 1, g));
    }

    function hold(clientX) {
      holding = true;
      k = gapFor(clientX);
      holdTarget = HOLD;
      if (a < 0) a = 0;                               // collapse a right swing before lifting left
    }
    function release() {
      if (!holding) return;
      holding = false;
      v = 0;
      idleTimer = 0;
    }

    root.addEventListener("mousemove", function (e) { hold(e.clientX); });
    root.addEventListener("mouseleave", release);
    root.addEventListener("click", function (e) { hold(e.clientX); a = holdTarget; release(); });
    root.addEventListener("touchstart", function (e) {
      if (!e.touches.length) return;
      hold(e.touches[0].clientX); a = holdTarget; release();
    }, { passive: true });

    if (!reduce) kick(1, 26);
    render();
    requestAnimationFrame(step);
  }

  document.addEventListener("DOMContentLoaded", function () {
    initCradle();
    initThemeToggle();
    initNav();
    initReveal();
    initFigmaEmbeds();
    initParallax();
    initTilt();
  });
})();
