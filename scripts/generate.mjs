#!/usr/bin/env node
// Zero-dependency static site generator.
// Reads content/*.json, writes index.html + work/*.html.
// Run: node scripts/generate.mjs
//
// Every internal link/asset path is written RELATIVE to the page that
// contains it (never a leading "/"), so the folder works when opened straight
// from disk (file://) and when served from a real domain.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const site = JSON.parse(readFileSync(path.join(ROOT, "content/site.json"), "utf8"));
const projects = JSON.parse(readFileSync(path.join(ROOT, "content/projects.json"), "utf8"));
const exp = JSON.parse(readFileSync(path.join(ROOT, "content/experience.json"), "utf8"));

const YEAR = new Date().getFullYear();
// Cache buster: changes on every generate so browsers never reuse a stale stylesheet.
const V = Date.now().toString(36);
const bySlug = Object.fromEntries(projects.map((p) => [p.slug, p]));

/* ---------------- helpers ---------------- */

const HOME_CTX = { base: "", isHome: true };
const WORK_CTX = { base: "../", isHome: false };

function siteHref(ctx, href) {
  if (href.startsWith("/#")) {
    const anchor = href.slice(1);
    return ctx.isHome ? anchor : `${ctx.base}index.html${anchor}`;
  }
  return ctx.base + href.slice(1);
}
function assetHref(ctx, relPath) {
  return ctx.base + relPath;
}
function workHref(ctx, slug) {
  return ctx.isHome ? `work/${slug}.html` : `${slug}.html`;
}
function attr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/* ---------------- shared partials ---------------- */

function headMeta(ctx, { title, description, path: urlPath, ogTitle }) {
  const canonical = `${site.url}${urlPath}`;
  return `
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${attr(description)}" />
  <link rel="canonical" href="${canonical}" />
  <link rel="icon" href="${assetHref(ctx, "favicon.svg")}" type="image/svg+xml" />
  <meta name="theme-color" content="#ebebe9" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${attr(ogTitle || title)}" />
  <meta property="og:description" content="${attr(description)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:site_name" content="${site.name}" />
  <meta property="og:image" content="${site.url}/og.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${attr(ogTitle || title)}" />
  <meta name="twitter:description" content="${attr(description)}" />
  <meta name="twitter:image" content="${site.url}/og.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@300;400;500;600&family=Inter:wght@400;500;600&display=swap" />
  <link rel="stylesheet" href="${assetHref(ctx, "assets/styles.css")}?v=${V}" />
  <script>
    (function () {
      try {
        var t = localStorage.getItem("theme");
        if (t === "dark" || t === "light") document.documentElement.setAttribute("data-theme", t);
      } catch (e) {}
    })();
  </script>`;
}

function themeToggleSvg() {
  return `
        <button class="theme-toggle" id="theme-toggle" type="button" aria-label="Toggle dark mode">
          <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" stroke-linecap="round"/></svg>
        </button>`;
}

function navHtml(ctx) {
  const links = site.nav.map((l) => `<a href="${siteHref(ctx, l.href)}">${l.label}</a>`).join("\n        ");
  const brandHref = ctx.isHome ? "#top" : `${ctx.base}index.html#top`;
  return `
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="nav-wrap">
    <nav id="nav">
      <a href="${brandHref}" class="brand"><span class="brand-mark"></span> ${site.name}</a>
      <div class="nav-links">
        ${links}
        <a href="${siteHref(ctx, "/#contact")}" class="nav-cta">Let&rsquo;s talk</a>
        ${themeToggleSvg()}
      </div>
    </nav>
  </div>`;
}

// A hand-drawn horizontal rule, slightly uneven on purpose.
function brushRule(cls = "") {
  return `<svg class="brush-rule ${cls}" viewBox="0 0 1200 12" preserveAspectRatio="none" aria-hidden="true"><path d="M2 7 C 120 4, 240 9, 360 6 S 600 3, 720 7 S 960 9, 1198 5" /></svg>`;
}

function footerHtml() {
  return `
  <footer>
    <span>${site.name} · ${YEAR}</span>
    <span>Designed and built by hand.</span>
  </footer>`;
}

function page(ctx, { title, description, urlPath, ogTitle, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>${headMeta(ctx, { title, description, path: urlPath, ogTitle })}
</head>
<body>
  <div class="grain"></div>
  ${navHtml(ctx)}
  <main id="main">
${body}
  </main>
  ${footerHtml()}
  <script src="${assetHref(ctx, "assets/main.js")}?v=${V}"></script>
</body>
</html>
`;
}

/* ---------------- project visuals ---------------- */

function visualHtml(ctx, project) {
  if (project.productImage) {
    return `
        <div class="product-stage">
          <div class="product-halo"></div>
          <img class="product-shot" src="${assetHref(ctx, project.productImage)}" alt="${attr(project.productImageAlt || "")}" loading="lazy" />
          ${project.productCaption ? `<div class="product-caption">${project.productCaption}</div>` : ""}
        </div>`;
  }
  if (project.media && project.media.length) {
    const m = project.media[0];
    return `
        <div class="media-frame">
          <img src="${assetHref(ctx, m.file)}" alt="${attr(m.alt)}" loading="lazy" />
        </div>`;
  }
  switch (project.visual) {
    case "nexus":
      return `
        <div class="stack-visual" aria-hidden="true">
          <div class="layer"><span>Agent</span><em>plan, load skills, execute</em></div>
          <div class="layer"><span>Model</span><em>hundred billion class, local, quantized</em></div>
          <div class="layer"><span>Data</span><em>private RAG, encrypted at rest</em></div>
          <div class="layer"><span>Connection</span><em>reachable without a public IP</em></div>
          <div class="stack-foot">one box · zero bytes uploaded</div>
        </div>`;
    case "flow":
      return `
        <div class="flow-ui" aria-hidden="true">
          <div class="flow-card"><h4>01 · Manual network workflow</h4><p>Repetitive verification, fragmented data, avoidable rework.</p></div>
          <div class="flow-arrow">↓</div>
          <div class="flow-card highlight">
            <h4>02 · Automation layer</h4>
            <p>Python tooling, validation logic, one standard workflow</p>
            <div class="flow-metric"><strong>60%</strong><span>faster signal verification</span></div>
          </div>
          <div class="flow-arrow">↓</div>
          <div class="flow-card"><h4>03 · Better operating system</h4><p>Faster delivery, improved accuracy, less engineering time lost.</p></div>
        </div>`;
    case "signals":
      return `
        <div class="signal-ui" aria-hidden="true">
          <div class="sig-row"><i></i><span>Large order flow anomaly detected</span><b>09:41</b></div>
          <div class="sig-row"><i style="opacity:.6"></i><span>Volume acceleration above baseline</span><b>10:03</b></div>
          <div class="sig-row"><i style="opacity:.35"></i><span>AI summary: sector momentum improving</span><b>10:18</b></div>
          <p class="sig-note">The system should not tell you what to think. It should help you notice what deserves attention.</p>
        </div>`;
    case "timeline":
      return `
        <div class="timeline-visual" aria-hidden="true">
          <div class="track">
            ${["2019", "2021", "2022", "2023", "2026"]
              .map(
                (yr, i) => `
            <div class="era">
              <span class="dot"></span>
              <span class="yr">${yr}</span>
              <span class="lbl">${["Consulting", "Plasma Physics", "Electrical Eng.", "Infrastructure", "AI Products"][i]}</span>
            </div>`
              )
              .join("")}
          </div>
        </div>`;
    default:
      return "";
  }
}

function isDarkVisual(project) {
  return !!(project.media && project.media.length) || project.visual === "aiHomeTheater";
}

/* ---------------- home page ---------------- */

function heroSection() {
  return `
    <section class="hero" id="top">
      <div class="hero-inner reveal">
        <div class="hero-kicker">${site.fullName} &nbsp;·&nbsp; ${site.role}</div>
        <h1 class="hero-name"><span>Ted</span><span>Wang</span></h1>
        <div class="hero-rule"></div>
        <p class="hero-tag">I build products where technology meets real-world problems.</p>
        <div class="hero-actions">
          <a class="btn primary" href="#work">Selected work <span class="arrow">→</span></a>
          <a class="btn" href="resume.pdf">Résumé <span class="arrow">↓</span></a>
        </div>
        <div class="hero-meta">
          <span>${site.school}</span>
          <span>${site.location}</span>
          <span>${site.statusIndicator}</span>
        </div>
      </div>
      <div class="hero-art reveal" aria-hidden="true">
        <div class="cradle">
          <div class="cradle-frame"></div>
          <div class="cradle-row">
            <div class="pend p1"><i></i><b></b></div>
            <div class="pend p2"><i></i><b></b></div>
            <div class="pend p3"><i></i><b></b></div>
            <div class="pend p4"><i></i><b></b></div>
            <div class="pend p5"><i></i><b></b></div>
          </div>
          <div class="cradle-floor"></div>
        </div>
      </div>
    </section>`;
}

function showcaseCard(ctx, b, i) {
  const stats = (b.stats || [])
    .map((s) => `<div class="sc-stat"><strong>${s.value}</strong><span>${s.label}</span></div>`)
    .join("");
  const tags = (b.tags || []).map((t) => `<span class="tag">${t}</span>`).join("");
  const frameTop =
    b.frame === "browser"
      ? `<div class="frame-bar"><span></span><span></span><span></span></div>`
      : `<div class="frame-bar panel"></div>`;
  return `
          <a class="showcase-card reveal${i % 2 === 1 ? " flip" : ""}" href="${workHref(ctx, b.slug)}" data-tilt>
            <div class="sc-media">
              <div class="sc-frame">${frameTop}
                <div class="sc-img"><img src="${assetHref(ctx, b.media)}" alt="" loading="lazy" /></div>
              </div>
              <div class="sc-sheen"></div>
            </div>
            <div class="sc-copy">
              <div class="branch-label">${b.label}</div>
              <h3>${b.title}</h3>
              <p>${b.blurb}</p>
              <div class="sc-stats">${stats}</div>
              <div class="tags">${tags}</div>
              <span class="sc-go">Read the branch <i>→</i></span>
            </div>
          </a>`;
}

function showcase(ctx, project, opts = {}) {
  if (!project.branches || !project.branches.length) return "";
  const cards = project.branches.map((b, i) => showcaseCard(ctx, b, i)).join("\n");
  const head = opts.heading
    ? `<div class="sc-head reveal"><span class="sc-node"></span><h2>${opts.heading}</h2></div>`
    : "";
  return `
        <div class="showcase${opts.wrap ? " boxed" : ""}">
          ${head}
          <div class="showcase-list">${cards}
          </div>
        </div>`;
}

function branchesStrip(ctx, project) {
  return showcase(ctx, project, { heading: "Two things I built off this trunk" });
}

function projectCard(project, index) {
  const metrics = project.metrics
    .map((m) => `<div class="m"><strong>${m.value}</strong><span>${m.label}</span></div>`)
    .join("");
  const tags = project.tags.map((t) => `<span class="tag">${t}</span>`).join("");
  const linkHref = workHref(HOME_CTX, project.slug);
  const isTrunk = !!(project.branches && project.branches.length);

  return `
        <article class="project reveal${index % 2 === 1 ? " reverse" : ""}${isTrunk ? " trunk" : ""}">
          <div class="project-copy">
            <div>
              <div class="project-num">${project.index} &nbsp;·&nbsp; ${project.category}</div>
              <h3>${project.headline}</h3>
              <p>${project.summary}</p>
              <div class="tags">${tags}</div>
              <div class="metrics-inline">${metrics}</div>
            </div>
            <a class="project-link" href="${linkHref}">Read the case study <span>→</span></a>
          </div>
          <div class="project-visual${isDarkVisual(project) ? " dark" : ""}">
            ${visualHtml(HOME_CTX, project)}
          </div>
        </article>
${branchesStrip(HOME_CTX, project)}`;
}

function workSection() {
  const top = projects.filter((p) => !p.parent);
  const cards = top.map((p, i) => projectCard(p, i)).join("\n");
  return `
    <section class="section" id="work">
      <div class="section-head reveal">
        <div class="portrait-col">
          <figure class="portrait">
            <img src="assets/img/ted-wang.jpg" alt="Ted Wang" loading="lazy" />
          </figure>
          <div class="section-kicker">Selected work</div>
        </div>
        <div>
          <h2>Ideas turned into systems people can actually use.</h2>
          <p class="section-sub">One main body of work at Dreame with two branches I built myself, the product I am building now, and the engineering that came before it.</p>
        </div>
      </div>
      <div class="projects">
${cards}
      </div>
    </section>`;
}

function philosophySection() {
  return `
    <section class="philosophy reveal">
      <div class="section-kicker">How I think</div>
      <blockquote>I like complicated systems.<br><span>I like making them feel simple.</span></blockquote>
      <p>My work has moved between physical infrastructure, software, AI, engineering, and product. What interests me most is usually the same problem: understanding how a complex system works, finding where users experience friction, and building something better.</p>
    </section>`;
}

function experienceSection() {
  const roles = exp.experience
    .map(
      (r) => `
          <div class="role reveal">
            <div class="year">${r.year}</div>
            <div>
              <h4>${r.org}</h4>
              <div class="where">${r.title}</div>
              <p>${r.description}</p>
            </div>
          </div>`
    )
    .join("");
  return `
    <section class="section" id="experience">
      <div class="experience-grid">
        <div class="sticky-title reveal">
          <div class="section-kicker">Experience</div>
          <h2>Engineering depth.<br>Product direction.</h2>
          <p class="section-sub">I did not start by trying to become a product person. I started by finding problems I wanted to fix.</p>
        </div>
        <div class="timeline">${roles}
        </div>
      </div>
    </section>`;
}

function principlesSection() {
  const items = [
    { idx: "01", title: "Start with the user.", body: "Technology matters only when it solves something people actually care about." },
    { idx: "02", title: "Understand the system.", body: "Good product decisions come from understanding technical constraints, incentives, workflows, and edge cases." },
    { idx: "03", title: "Build, test, iterate.", body: "I prefer prototypes, experiments, and real user feedback over endless speculation." },
  ]
    .map(
      (p) => `
        <div class="principle reveal">
          <div class="idx">${p.idx}</div>
          <div>
            <h4>${p.title}</h4>
            <p>${p.body}</p>
          </div>
        </div>`
    )
    .join("");
  return `
    <section class="section">
      <div class="section-head reveal">
        <div class="section-kicker">How I work</div>
        <div><h2>Three principles I keep coming back to.</h2></div>
      </div>
      <div class="principles">${items}
      </div>
    </section>`;
}

function aboutSection() {
  const skillGroups = exp.skillGroups
    .map(
      (g) => `
          <div class="skill-group">
            <h5>${g.name}</h5>
            <p>${g.skills.join(" · ")}</p>
          </div>`
    )
    .join("");
  const edu = exp.education
    .map(
      (e) => `
          <div class="edu-item">
            <div class="school">${e.school}</div>
            <div class="degree">${e.degree}</div>
            <div class="note">${e.note}</div>
          </div>`
    )
    .join("");
  return `
    <section class="section" id="about">
      <div class="section-head reveal">
        <div class="section-kicker">About</div>
        <div><h2>Technical enough to go deep.<br>Product minded enough to zoom out.</h2></div>
      </div>
      <div class="about-wrap">
        <div class="about-card reveal">
          <p>Currently studying <strong>Systems Engineering at Cornell</strong>, I&rsquo;m interested in product roles at the intersection of AI, infrastructure, developer tools, and intelligent consumer products.</p>
          <p>Before Cornell, I worked on <strong>telecommunications infrastructure</strong> in New York, where I started building automation tools for problems I kept running into in my own workflows. That pushed me deeper into product development: talking to users, defining problems, prototyping solutions, evaluating AI systems, and working across engineering and business.</p>
          <p class="fine">When I&rsquo;m not building things, you&rsquo;ll probably find me playing golf, exploring new technology, or spending too much time analyzing markets.</p>
        </div>
        <div class="skills-card reveal">
          <div class="skills-grid">${skillGroups}
          </div>
          <div class="edu-block">
            <h5 class="edu-title">Education</h5>
            ${edu}
          </div>
        </div>
      </div>
    </section>`;
}

function contactSection() {
  return `
    <section class="contact reveal" id="contact">
      <div class="section-kicker">Next chapter</div>
      <h2>Let&rsquo;s build something interesting.</h2>
      <p>I&rsquo;m always interested in conversations about AI products, product management, infrastructure, and ambitious technical ideas.</p>
      <div class="hero-actions">
        <a class="btn primary" href="mailto:${site.email}">Email me <span class="arrow">↗</span></a>
        <a class="btn" href="${site.linkedin}" target="_blank" rel="noreferrer">LinkedIn <span class="arrow">↗</span></a>
        <a class="btn" href="resume.pdf">Résumé <span class="arrow">↓</span></a>
      </div>
    </section>`;
}

function buildHome() {
  const body = [heroSection(), workSection(), philosophySection(), experienceSection(), principlesSection(), aboutSection(), contactSection()].join("\n");
  return page(HOME_CTX, { title: `${site.name} · ${site.role}`, description: site.description, urlPath: "/", body });
}

/* ---------------- case study blocks ---------------- */

function csBlock(eyebrow, inner, extraClass = "") {
  return `
      <div class="cs-block reveal ${extraClass}">
        <div class="eyebrow2">${eyebrow}</div>
        <div>${inner}
        </div>
      </div>`;
}

function csProse(eyebrow, title, paragraphs) {
  return csBlock(eyebrow, `
          <div class="prose">
            <h2>${title}</h2>
            ${paragraphs.map((p) => `<p>${p}</p>`).join("\n            ")}
          </div>`);
}

function csBullets(eyebrow, title, items) {
  return csBlock(eyebrow, `
          <h2>${title}</h2>
          <ul class="bullets">
            ${items.map((i) => `<li>${i}</li>`).join("\n            ")}
          </ul>`);
}

function csDecisionProcess(items) {
  return csBlock("Decision process", `
          <div class="decision-steps">
          ${items
            .map(
              (step, i) => `
            <div class="decision-step">
              <div class="step-head"><span class="step-idx">${String(i + 1).padStart(2, "0")}</span><h3>${step.heading}</h3></div>
              ${step.body.map((p) => `<p>${p}</p>`).join("\n              ")}
            </div>`
            )
            .join("")}
          </div>`);
}

function csMetrics(metrics) {
  return csBlock("Results", `
          <div class="cs-metrics">
            ${metrics.map((m) => `<div class="cs-metric"><strong>${m.value}</strong><span>${m.label}</span></div>`).join("\n            ")}
          </div>`);
}

function csCallout(eyebrow, text) {
  return csBlock(eyebrow, `
          <p class="callout-text">${text}</p>`);
}

function csMedia(ctx, eyebrow, m) {
  return csBlock(eyebrow, `
          <figure class="cs-figure">
            <img src="${assetHref(ctx, m.file)}" alt="${attr(m.alt)}" loading="lazy" />
            <figcaption>${m.caption}</figcaption>
          </figure>`);
}

function csPipeline(steps, title) {
  return csBlock("Pipeline", `
          <h2>${title || "From a web page to a panel"}</h2>
          <ul class="pipeline">
            ${steps.map((s, i) => `<li><span class="pl-idx">${i + 1}</span><span>${s}</span></li>`).join("\n            ")}
          </ul>`);
}

function csThesis(t) {
  const cols = t.items
    .map(
      (it) => `
            <div class="thesis-col">
              <div class="thesis-pain"><span class="strike">${it.pain}</span><p>${it.painDetail}</p></div>
              <div class="thesis-arrow" aria-hidden="true">↓</div>
              <div class="thesis-answer"><span>${it.answer}</span><p>${it.answerDetail}</p></div>
            </div>`
    )
    .join("");
  return csBlock(t.eyebrow, `
          <h2>${t.title}</h2>
          <p class="lead">${t.intro}</p>
          <div class="thesis-grid">${cols}
          </div>
          <p class="positioning">${t.positioning}</p>`, "wide");
}

function csPrd(p) {
  const personas = p.personas
    .map((x) => `<div class="persona"><h4>${x.name}</h4><div class="who">${x.who}</div><p>${x.pain}</p></div>`)
    .join("");
  const phases = p.roadmap
    .map(
      (ph) => `
              <div class="phase">
                <div class="phase-head"><span class="phase-id">${ph.phase}</span><span class="phase-window">${ph.window}</span></div>
                <div class="phase-goal">${ph.goal}</div>
                <ul>${ph.items.map((i) => `<li>${i}</li>`).join("")}</ul>
              </div>`
    )
    .join("");
  const layers = p.layers.map((l) => `<div class="prd-layer"><span>${l.name}</span><em>${l.items}</em></div>`).join("");
  return csBlock(p.eyebrow, `
          <h2>${p.title}</h2>
          <p class="lead">${p.intro}</p>

          <blockquote class="vision">${p.vision}</blockquote>

          <div class="prd-sub">Differentiators</div>
          <ul class="bullets">${p.differentiators.map((d) => `<li>${d}</li>`).join("")}</ul>

          <div class="prd-sub">${(p.labels||{}).personas || "Who it is for"}</div>
          <div class="personas">${personas}</div>

          <div class="prd-sub">${(p.labels||{}).baseline || "Already working when I arrived"}</div>
          <div class="chips">${p.baseline.map((b) => `<span class="chip">${b}</span>`).join("")}</div>

          <div class="prd-sub">${(p.labels||{}).roadmap || "The four phases"}</div>
          <div class="roadmap">${phases}
          </div>

          <div class="prd-sub">Architecture</div>
          <div class="prd-layers">${layers}</div>

          <div class="prd-sub">${(p.labels||{}).buy || "Buy, don&rsquo;t build"}</div>
          <p class="prd-p">${p.buyNotBuild}</p>

          <div class="prd-sub">${(p.labels||{}).nfrs || "Non functional bar"}</div>
          <div class="chips">${p.nfrs.map((b) => `<span class="chip">${b}</span>`).join("")}</div>`, "wide");
}

function figmaCard(ctx, f) {
  const embed = `https://embed.figma.com/design/${f.key}/x?node-id=${f.node}&embed-host=share&theme=light`;
  const branchLink = f.branch ? `<a class="figma-branch" href="${workHref(ctx, f.branch)}">Read the branch →</a>` : "";
  return `
            <div class="figma-card">
              <div class="figma-media" data-embed="${attr(embed)}">
                <img src="${assetHref(ctx, f.cover)}" alt="Cover of the ${f.title} design file" loading="lazy" />
                <button type="button" class="figma-play" aria-label="Load the live Figma canvas for ${attr(f.title)}">Preview live canvas</button>
              </div>
              <div class="figma-copy">
                <div class="figma-maps">${f.maps}</div>
                <h4>${f.title}</h4>
                <ul class="flows">${f.flows.map((x) => `<li>${x}</li>`).join("")}</ul>
                <div class="figma-links">
                  <a href="${attr(f.url)}" target="_blank" rel="noreferrer">Open in Figma ↗</a>
                  ${branchLink}
                </div>
              </div>
            </div>`;
}

function csFigma(ctx, fg) {
  return csBlock(fg.eyebrow, `
          <h2>${fg.title}</h2>
          <p class="lead">${fg.intro}</p>
          <div class="figma-grid">${fg.files.map((f) => figmaCard(ctx, f)).join("")}
          </div>`, "wide");
}

function csBranches(ctx, project) {
  return csBlock("Branches", `
          <h2>Two things I built off this trunk</h2>
          ${showcase(ctx, project, {})}`, "wide");
}

function buildCaseStudy(project, next) {
  const cs = project.caseStudy;
  const tags = project.tags.map((t) => `<span class="tag">${t}</span>`).join("");
  const parent = project.parent ? bySlug[project.parent] : null;
  const crumb = parent
    ? `<a class="cs-back" href="${workHref(WORK_CTX, parent.slug)}">← Part of ${parent.headline.replace(/\.$/, "")}</a>`
    : `<a class="cs-back" href="${siteHref(WORK_CTX, "/#work")}">← Back to work</a>`;

  const body = `
  <header class="cs-header reveal">
    ${crumb}
    <div class="section-kicker">${project.index} &nbsp;·&nbsp; ${project.category}</div>
    <h1>${project.headline}</h1>
    <p class="lede">${project.summary}</p>
    <div class="tags">${tags}</div>
    ${project.links ? `<div class="cs-links">${project.links.map((l) => `<a class="btn" href="${attr(l.url)}" target="_blank" rel="noreferrer">${l.label} <span class="arrow">↗</span></a>`).join("")}</div>` : ""}
  </header>

  <div class="cs-visual-wrap reveal">
    <div class="cs-visual${isDarkVisual(project) ? " dark" : ""}">
      ${visualHtml(WORK_CTX, project)}
    </div>
  </div>

  <div class="cs-body">
${csProse("Problem", "What was not working", [cs.problem])}
${csProse("Insight", "What the user actually needed", [cs.insight])}
${project.thesis ? csThesis(project.thesis) : ""}
${project.prd ? csPrd(project.prd) : ""}
${csBullets("My role", "What I owned", cs.role)}
${csBullets("Constraints", "What had to be true", cs.constraints)}
${csDecisionProcess(cs.decisionProcess)}
${project.prototypeNote ? csCallout("Prototype", project.prototypeNote) : ""}
${csBullets("Solution", "What shipped", cs.solution)}
${project.media && project.media.length ? project.media.map((m, i) => csMedia(WORK_CTX, m.eyebrow || (i === 0 ? "Shipped" : "Also"), m)).join("") : ""}
${csBullets("Architecture", "How it was built", cs.architecture)}
${project.pipeline ? csPipeline(project.pipeline, project.pipelineTitle) : ""}
${csBullets("Product decisions", "Trade offs I made on purpose", cs.productDecisions)}
${project.figma ? csFigma(WORK_CTX, project.figma) : ""}
${csMetrics(cs.results)}
${csBullets("What I learned", "Takeaways", cs.learnings)}
${project.branches ? csBranches(WORK_CTX, project) : ""}
  </div>

  <div class="cs-next reveal">
    <a href="${next.slug}.html">
      <div>
        <div class="lbl">Next</div>
        <div class="title">${next.headline}</div>
      </div>
      <span class="go">→</span>
    </a>
  </div>`;

  return page(WORK_CTX, {
    title: `${project.headline} · ${site.name}`,
    description: project.summary,
    urlPath: `/work/${project.slug}.html`,
    ogTitle: `${project.headline} · ${site.name}`,
    body,
  });
}

/* ---------------- write files ---------------- */

writeFileSync(path.join(ROOT, "index.html"), buildHome());
console.log("wrote index.html");

mkdirSync(path.join(ROOT, "work"), { recursive: true });
const withCaseStudy = projects.filter((p) => p.caseStudy);
withCaseStudy.forEach((project, i) => {
  const next = withCaseStudy[(i + 1) % withCaseStudy.length];
  writeFileSync(path.join(ROOT, "work", `${project.slug}.html`), buildCaseStudy(project, next));
  console.log(`wrote work/${project.slug}.html`);
});

const urls = ["/", ...withCaseStudy.map((p) => `/work/${p.slug}.html`)];
writeFileSync(
  path.join(ROOT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${site.url}${u}</loc></url>`)
    .join("\n")}\n</urlset>\n`
);
writeFileSync(path.join(ROOT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`);
console.log("wrote sitemap.xml, robots.txt");
