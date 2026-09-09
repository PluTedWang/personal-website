#!/usr/bin/env node
// Zero-dependency static site generator.
// Reads content/*.json, writes index.html + work/*.html.
// Run: node scripts/generate.mjs

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const site = JSON.parse(readFileSync(path.join(ROOT, "content/site.json"), "utf8"));
const projects = JSON.parse(readFileSync(path.join(ROOT, "content/projects.json"), "utf8"));
const exp = JSON.parse(readFileSync(path.join(ROOT, "content/experience.json"), "utf8"));

const YEAR = new Date().getFullYear();

/* ---------------- shared partials ---------------- */

function headMeta({ title, description, path: urlPath, ogTitle }) {
  const canonical = `${site.url}${urlPath}`;
  return `
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${canonical}" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <meta name="theme-color" content="#f4f3ef" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${ogTitle || title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:site_name" content="${site.name}" />
  <meta property="og:image" content="${site.url}/og.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${ogTitle || title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${site.url}/og.png" />
  <link rel="stylesheet" href="/assets/styles.css" />
  <script>
    // Set theme before paint to avoid a flash of the wrong theme.
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
          <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" stroke-linecap="round"/></svg>
        </button>`;
}

function navHtml() {
  const links = site.nav
    .map((l) => `<a href="${l.href}">${l.label}</a>`)
    .join("\n        ");
  return `
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="nav-wrap">
    <nav id="nav">
      <a href="/#top" class="brand"><span class="brand-dot"></span> ${site.name.toUpperCase()}</a>
      <div class="nav-links">
        ${links}
        <a href="/#contact" class="nav-cta">Let&rsquo;s talk ↗</a>
        ${themeToggleSvg()}
      </div>
    </nav>
  </div>`;
}

function footerHtml() {
  return `
  <footer>
    <span>${site.name.toUpperCase()} © ${YEAR}</span>
    <span>Designed with curiosity. Built with intention.</span>
  </footer>`;
}

function page({ title, description, urlPath, ogTitle, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>${headMeta({ title, description, path: urlPath, ogTitle })}
</head>
<body>
  <div class="grain"></div>
  ${navHtml()}
  <main id="main">
${body}
  </main>
  ${footerHtml()}
  <script src="/assets/main.js"></script>
</body>
</html>
`;
}

/* ---------------- project visuals ---------------- */

function visualHtml(project) {
  switch (project.visual) {
    case "aiHomeTheater":
      return `
        <div class="ai-ui">
          <div class="fake-top"><span class="fake-dot"></span><span class="fake-dot"></span><span class="fake-dot"></span></div>
          <div class="ai-header"><strong>Home Theater</strong><span class="ai-badge">Local AI</span></div>
          <div class="media-grid">${Array.from({ length: 8 }).map(() => `<div class="poster"></div>`).join("")}</div>
          <div class="ai-panel"><span class="pulse"></span><span>&ldquo;Find something atmospheric under 2 hours.&rdquo;</span><b>Ask AI →</b></div>
        </div>`;
    case "flow":
      return `
        <div class="flow-ui">
          <div class="flow-card"><h4>01 · Manual network workflow</h4><p>Repetitive verification, fragmented data, avoidable rework.</p></div>
          <div class="flow-arrow">↓</div>
          <div class="flow-card highlight">
            <h4>02 · Automation layer</h4>
            <p>Python tooling + validation logic + standardized workflow</p>
            <div class="flow-metric"><strong>60%</strong><span>faster signal verification</span></div>
          </div>
          <div class="flow-arrow">↓</div>
          <div class="flow-card"><h4>03 · Better operating system</h4><p>Faster delivery, improved accuracy, less engineering time lost.</p></div>
        </div>`;
    case "signals":
      return `
        <div class="ai-ui tilt-r">
          <div class="fake-top"><span class="fake-dot"></span><span class="fake-dot"></span><span class="fake-dot"></span></div>
          <div class="ai-header"><strong>Signal Feed</strong><span class="ai-badge">AI Analysis</span></div>
          <div style="display:grid;gap:9px">
            <div class="ai-panel"><span class="pulse"></span><span>Large order-flow anomaly detected</span><b>09:41</b></div>
            <div class="ai-panel"><span class="pulse" style="opacity:.65"></span><span>Volume acceleration above baseline</span><b>10:03</b></div>
            <div class="ai-panel"><span class="pulse" style="opacity:.4"></span><span>AI summary: sector momentum improving</span><b>10:18</b></div>
          </div>
          <div class="ai-note">The system should not tell you what to think. It should help you notice what deserves attention.</div>
        </div>`;
    case "timeline":
      return `
        <div class="timeline-visual">
          <div class="track">
            ${["2019", "2021", "2022", "2023", "2026"]
              .map(
                (yr, i) => `
            <div class="era">
              <span class="dot"></span>
              <span class="yr">${yr}</span>
              <span class="lbl">${
                ["Consulting", "Plasma Physics", "Electrical Eng.", "Infrastructure", "AI Products"][i]
              }</span>
            </div>`
              )
              .join("")}
          </div>
        </div>`;
    default:
      return "";
  }
}

function isDarkVisual(v) {
  return v === "aiHomeTheater" || v === "signals";
}

/* ---------------- home page ---------------- */

function heroSection() {
  return `
    <section class="hero" id="top">
      <div class="hero-left reveal">
        <div class="eyebrow">${site.role}</div>
        <h1>I build products where <span class="soft">technology meets</span> <span class="accent-word">real-world problems.</span></h1>
        <p class="hero-copy">I&rsquo;m Ted Wang — a Cornell Systems Engineering graduate student with experience across AI products, telecommunications infrastructure, automation, and product development.</p>
        <div class="hero-actions">
          <a class="btn primary" href="#work">Explore my work <span class="arrow">→</span></a>
          <a class="btn" href="/resume.pdf">Download résumé <span class="arrow">↓</span></a>
        </div>
        <div class="hero-meta">
          <span><i></i>${site.school}</span>
          <span><i></i>${site.location}</span>
          <span><i></i>${site.focus}</span>
        </div>
      </div>
      <div class="system-art reveal">
        <canvas id="network" aria-hidden="true"></canvas>
        <div class="orbit-card">
          <div class="orbit-core"><span>TED</span></div>
          <div class="orb-label l1">Users</div>
          <div class="orb-label l2">AI</div>
          <div class="orb-label l3">Systems</div>
          <div class="orb-label l4">Business</div>
        </div>
      </div>
    </section>`;
}

function tickerSection() {
  const words = ["USER RESEARCH", "AI AGENTS", "MCP", "PRODUCT STRATEGY", "INFRASTRUCTURE", "AUTOMATION", "LLMs", "SYSTEMS THINKING"];
  const list = [...words, ...words].map((w) => `<span>${w}</span>`).join("");
  return `
    <div class="ticker-wrap">
      <div class="ticker">${list}</div>
    </div>`;
}

function projectCard(project, index) {
  const metrics = project.metrics
    .map((m) => `<div class="m"><strong>${m.value}</strong><span>${m.label}</span></div>`)
    .join("");
  const tags = project.tags.map((t) => `<span class="tag">${t}</span>`).join("");
  const linkHref = project.isCaseStudy ? `/work/${project.slug}.html` : `#experience`;
  const linkLabel = project.isCaseStudy ? "View case study" : "See the throughline";
  const linkArrow = project.isCaseStudy ? "→" : "↗";

  return `
        <article class="project reveal${index % 2 === 1 ? " reverse" : ""}">
          <div class="project-copy">
            <div>
              <div class="project-num">${project.index} · ${project.category}</div>
              <h3>${project.headline}</h3>
              <p>${project.summary}</p>
              <div class="tags">${tags}</div>
              <div class="metrics-inline">${metrics}</div>
            </div>
            <a class="project-link" href="${linkHref}">${linkLabel} <span>${linkArrow}</span></a>
          </div>
          <div class="project-visual${isDarkVisual(project.visual) ? " dark" : ""}">
            ${visualHtml(project)}
          </div>
        </article>`;
}

function workSection() {
  const cards = projects.map((p, i) => projectCard(p, i)).join("\n");
  return `
    <section class="section" id="work">
      <div class="section-head reveal">
        <div class="section-kicker">Selected work</div>
        <div>
          <h2>Ideas turned into systems people can actually use.</h2>
          <p class="section-sub">Products and systems I've helped turn from ideas into something people can actually use.</p>
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
      <div class="section-kicker" style="margin-bottom:24px">How I think</div>
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
          <h2 style="margin-top:16px">Engineering depth.<br>Product direction.</h2>
          <p class="section-sub">I didn&rsquo;t start by trying to become &ldquo;a product person.&rdquo; I started by finding problems I wanted to fix.</p>
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
        <div><h2>Technical enough to go deep.<br>Product-minded enough to zoom out.</h2></div>
      </div>
      <div class="about-wrap">
        <div class="about-card reveal">
          <p>Currently studying <strong>Systems Engineering at Cornell</strong>, I&rsquo;m interested in product roles at the intersection of AI, infrastructure, developer tools, and intelligent consumer products.</p>
          <p>Before Cornell, I worked on <strong>telecommunications infrastructure</strong> in New York, where I started building automation tools for problems I repeatedly encountered in my own workflows. That experience pushed me deeper into product development: talking to users, defining problems, prototyping solutions, evaluating AI systems, and working across engineering and business.</p>
          <p class="fine">When I&rsquo;m not building things, you&rsquo;ll probably find me playing golf, exploring new technology, or spending too much time analyzing markets.</p>
        </div>
        <div class="skills-card reveal">
          <div class="skills-grid">${skillGroups}
          </div>
          <div class="edu-block">
            <h5 style="font-size:12px;text-transform:uppercase;letter-spacing:.09em;color:var(--muted-2);margin:0 0 12px">Education</h5>
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
        <a class="btn" href="/resume.pdf">Résumé <span class="arrow">↓</span></a>
      </div>
    </section>`;
}

function buildHome() {
  const body = [
    heroSection(),
    tickerSection(),
    workSection(),
    philosophySection(),
    experienceSection(),
    principlesSection(),
    aboutSection(),
    contactSection(),
  ].join("\n");

  return page({
    title: `${site.name} — ${site.role}`,
    description: site.description,
    urlPath: "/",
    body,
  });
}

/* ---------------- case study pages ---------------- */

function csProse(eyebrow, title, paragraphs) {
  return `
      <div class="cs-block reveal">
        <div class="eyebrow2">${eyebrow}</div>
        <div class="prose">
          <h2>${title}</h2>
          ${paragraphs.map((p) => `<p>${p}</p>`).join("\n          ")}
        </div>
      </div>`;
}

function csBullets(eyebrow, title, items) {
  return `
      <div class="cs-block reveal">
        <div class="eyebrow2">${eyebrow}</div>
        <div>
          <h2>${title}</h2>
          <ul class="bullets">
            ${items.map((i) => `<li>${i}</li>`).join("\n            ")}
          </ul>
        </div>
      </div>`;
}

function csDecisionProcess(items) {
  return `
      <div class="cs-block reveal">
        <div class="eyebrow2">Decision Process</div>
        <div class="decision-steps">
          ${items
            .map(
              (step, i) => `
          <div class="decision-step">
            <div class="step-head"><span class="step-idx">${String(i + 1).padStart(2, "0")}</span><h3>${step.heading}</h3></div>
            ${step.body.map((p) => `<p>${p}</p>`).join("\n            ")}
          </div>`
            )
            .join("")}
        </div>
      </div>`;
}

function csMetrics(metrics) {
  return `
      <div class="cs-block reveal">
        <div class="eyebrow2">Results</div>
        <div class="cs-metrics">
          ${metrics
            .map((m) => `<div class="cs-metric"><strong>${m.value}</strong><span>${m.label}</span></div>`)
            .join("\n          ")}
        </div>
      </div>`;
}

function buildCaseStudy(project, next) {
  const cs = project.caseStudy;
  const tags = project.tags.map((t) => `<span class="tag">${t}</span>`).join("");

  const body = `
  <header class="cs-header">
    <a class="cs-back reveal" href="/#work">← Back to work</a>
    <div class="reveal">
      <div class="section-kicker">${project.index} · ${project.category}</div>
      <h1>${project.headline}</h1>
      <p class="lede">${project.summary}</p>
      <div class="tags" style="margin-top:22px">${tags}</div>
    </div>
  </header>

  <div class="cs-visual-wrap reveal">
    <div class="cs-visual${isDarkVisual(project.visual) ? " dark" : ""}" style="${
    isDarkVisual(project.visual)
      ? "background:var(--dark-panel)"
      : "background:linear-gradient(140deg, rgba(74,114,255,.08), rgba(255,255,255,.02));border:1px solid var(--line)"
  }">
      ${visualHtml(project)}
    </div>
  </div>

  <div class="cs-body">
${csProse("Problem", "What wasn&rsquo;t working", [cs.problem])}
${csProse("User Insight", "What the user actually needed", [cs.insight])}
${csBullets("My Role", "What I owned", cs.role)}
${csBullets("Constraints", "What had to be true", cs.constraints)}
${csDecisionProcess(cs.decisionProcess)}
${csBullets("Solution", "What shipped", cs.solution)}
${csBullets("Technical Architecture", "How it was built", cs.architecture)}
${csBullets("Product Decisions", "Trade-offs I made on purpose", cs.productDecisions)}
${csMetrics(cs.results)}
${csBullets("What I Learned", "Takeaways", cs.learnings)}
  </div>

  <div class="cs-next reveal">
    <a href="/work/${next.slug}.html">
      <div>
        <div class="lbl">Next case study</div>
        <div class="title">${next.headline}</div>
      </div>
      <span class="go">→</span>
    </a>
  </div>`;

  return page({
    title: project.headline,
    description: project.summary,
    urlPath: `/work/${project.slug}.html`,
    ogTitle: `${project.headline} — ${site.name}`,
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
  const html = buildCaseStudy(project, next);
  writeFileSync(path.join(ROOT, "work", `${project.slug}.html`), html);
  console.log(`wrote work/${project.slug}.html`);
});

/* ---------------- sitemap + robots ---------------- */

const urls = ["/", ...withCaseStudy.map((p) => `/work/${p.slug}.html`)];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${site.url}${u}</loc></url>`).join("\n")}
</urlset>
`;
writeFileSync(path.join(ROOT, "sitemap.xml"), sitemap);

const robots = `User-agent: *
Allow: /

Sitemap: ${site.url}/sitemap.xml
`;
writeFileSync(path.join(ROOT, "robots.txt"), robots);

console.log("wrote sitemap.xml, robots.txt");
console.log("Done. Open index.html in a browser, or serve the folder with any static file server.");
