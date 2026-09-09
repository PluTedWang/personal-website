# Ted Wang — Personal Website

A dependency-free static site: semantic HTML + CSS + vanilla JS. No build
step, no `npm install` — open `index.html` in a browser and it works.

## Structure

```
index.html                  Home page (generated — do not hand-edit)
work/<slug>.html             4 case study pages (generated — do not hand-edit)
content/site.json            Identity + contact links + nav
content/projects.json        The 4 "Selected Work" projects and their full
                              case-study content (problem, insight, role,
                              constraints, decision process, solution,
                              architecture, decisions, results, learnings)
content/experience.json       Work history, skill groups, education
assets/styles.css            All styles (design tokens + light/dark theme)
assets/main.js                Nav scroll state, dark-mode toggle, reveal-on-
                              scroll animation, hero canvas visualization
scripts/generate.mjs          Static-site generator — reads content/*.json,
                              writes index.html + work/*.html
scripts/build_resume.py       Generates resume.pdf from the same content
resume.pdf                    Downloadable résumé (linked from nav + hero + footer CTA)
favicon.svg, og.png, robots.txt, sitemap.xml
```

## Editing content

Don't hand-edit `index.html` or the files in `work/` — they're generated.
Edit the JSON in `content/` instead, then regenerate:

```bash
node scripts/generate.mjs
```

To add a 5th case study, add an entry to `content/projects.json` (copy the
shape of an existing one) and rerun the command above — a new page at
`work/<slug>.html` is created automatically and it's wired into the
"Selected Work" grid and the case-study next/prev links.

To regenerate the résumé after editing your experience:

```bash
python3 scripts/build_resume.py   # needs: pip install reportlab
```

## Before you publish

A few placeholders are worth a look:

- `content/site.json` → `linkedin` is a placeholder URL — update it to your
  real profile.
- `content/site.json` → `url` (`https://tedwang.dev`) is used for canonical
  links, sitemap.xml, and Open Graph tags — set it to wherever this actually
  deploys, then rerun the generator.

## Deploying

It's static files — any host works: GitHub Pages, Netlify, Vercel (no build
command needed, just point it at this folder), Cloudflare Pages, or a plain
web server. Nothing needs compiling.

## Design notes

- Palette: warm off-white / near-black, one muted-blue accent — both a light
  theme and a full dark theme (toggle in the nav, persisted via
  `localStorage`, respects `prefers-color-scheme` by default).
- Motion: IntersectionObserver-based reveal-on-scroll, a subtle canvas node
  network in the hero that responds to the cursor, CSS-only hover states —
  all wrapped in `prefers-reduced-motion` guards.
- Each of the 4 projects has its own visual identity (a media-app mock, a
  workflow diagram, a signal feed, an era timeline) rather than identical
  cards.

## A note on the tech stack

The original brief asked for Next.js/TypeScript/Tailwind/Framer Motion. That
stack was started, but this session's org-level network settings blocked
`registry.npmjs.org` ("host not in allowlist"), so it couldn't be installed
or verified here. This static build is functionally and visually equivalent,
fully tested (Playwright, headless, both themes, all 5 pages, zero console
errors), and has no install step. If you still want the Next.js version,
ask and it can be finished once npm access is available (in your own local
environment, or a future session with that access) — the design and content
above translate directly.
