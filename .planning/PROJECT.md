# Screenie

## What This Is

An open source CLI tool that captures responsive screenshots across 57 device dimensions and generates HTML reports for quick visual review. Available via npm (`npx screenie`) with documentation at docs.screenie.xyz and a landing page at screenie.xyz showcasing the tool.

## Core Value

Instantly verify that a web app looks correct across all device sizes without manual testing — run one command, review one report.

## Current Milestone: v2.0 Open Source Release

**Goal:** Polish and publish Screenie as a professional open source tool with npm package, landing page, and documentation site.

**Target features:**
- Rebrand to "Screenie" (package name, CLI command, all references)
- Publish to npm for easy installation (`npx screenie` or global install)
- Landing page at screenie.xyz (minimal hero, demo GIF/video, links)
- Documentation site at docs.screenie.xyz (full guides and reference)
- Demo GIF/video showing the tool in action

## Requirements

### Validated

- `SHOT-01` Full-page screenshots — v1.0
- `SHOT-02` Parallel execution with configurable concurrency (default 10) — v1.0
- `SHOT-03` CSS animation disabling before capture — v1.0
- `SHOT-04` Retry on failure (2-3 attempts for transient errors) — v1.0
- `DEV-01` 57 built-in device presets (24 phones, 13 tablets, 20 desktops) — v1.0
- `DEV-02` Screenshots organized into phones/tablets/pc-laptops folders — v1.0
- `DEV-03` Device filtering flags (--phones-only, --tablets-only, --desktops-only) — v1.0
- `CLI-01` Base URL argument (localhost or remote) — v1.0
- `CLI-02` Page path argument — v1.0
- `CLI-03` Multiple pages flag (--pages) — v1.0
- `CLI-04` Concurrency flag (--concurrency) — v1.0
- `OUT-01` Descriptive file names (device-name-widthxheight.png) — v1.0
- `OUT-02` HTML report with responsive grid view — v1.0
- `OUT-03` Category grouping in report — v1.0
- `OUT-04` Thumbnails with click-to-enlarge — v1.0
- `OUT-05` Metadata display (URL, timestamp, duration, device count) — v1.0
- `OUT-06` Auto-open report in browser — v1.0
- `LOAD-01` Network idle wait before capture — v1.0
- `LOAD-02` Configurable wait buffer (default 500ms) — v1.0
- `LOAD-03` Lazy content scroll triggering — v1.0
- `LOAD-04` Max timeout (30s) — v1.0
- `LOAD-05` Custom wait flag (--wait) — v1.0
- `UX-01` Progress indicators (ora spinner) — v1.0
- `UX-02` Cookie banner auto-hiding (50+ selectors) — v1.0
- `UX-03` Clear error messages with actionable hints — v1.0

### Active

- [ ] Rebrand to "screenie" (package.json name, CLI command, README, all references)
- [ ] Publish to npm with proper package metadata
- [ ] Landing page at screenie.xyz (minimal hero, demo, links)
- [ ] Demo GIF/video showing CLI in action with results
- [ ] Documentation site at docs.screenie.xyz (VitePress)
- [ ] Getting started guide
- [ ] CLI reference documentation
- [ ] Programmatic usage guide
- [ ] Device presets reference
- [ ] Deploy landing page and docs to Vercel/Netlify

### Future (v2.1+)

- Config file support (.responsiverc.json)
- Custom viewport definitions via config
- Output directory flag (--output)
- URL list from file input
- Element hiding via CSS selector (--hide)
- Dark mode capture (--dark-mode)

### Out of Scope

- Hosted web application — users run CLI locally
- Backend/API — no server-side screenshot capture
- Visual regression/diff comparison — Percy/Applitools territory
- Real device cloud testing — BrowserStack domain
- User accounts/authentication — open source tool, no login
- Cross-browser (Firefox/Safari) — Chrome sufficient for layout verification
- PDF/video export — focus on screenshots + HTML

## Context

v1.0 shipped with 5,954 LOC TypeScript, 291 tests passing.
Tech stack: Node.js 20+, Playwright (Chromium), TypeScript, tsup, Vitest.
57 device presets covering flagship phones (iPhone 15/16, Pixel 8, Galaxy S24), tablets (iPad Pro, Galaxy Tab), and common desktop resolutions.

v2.0 focuses on open source release — rebranding, npm publishing, and professional documentation. The CLI core remains unchanged; this milestone adds discoverability and polish for public use.

## Constraints

- **Tech stack**: Node.js + Playwright (Chromium) — mature, handles parallel execution well
- **Performance**: 57 screenshots in ~30-40 seconds via parallelization (10 concurrent default)
- **Page timing**: Network idle detection + 500ms buffer, 30s max timeout
- **Output**: Self-contained HTML report with base64 images (works offline)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Full-page screenshots (not viewport-only) | Catch layout issues anywhere on page | Good |
| Playwright over Puppeteer | Better API, built-in device emulation | Good |
| HTML report over folder browsing | Scanning 50+ images in grid is faster | Good |
| Parallel execution with p-limit | 57 devices sequentially ~3min; parallel ~40sec | Good |
| CSS-only lightbox | No JavaScript, self-contained HTML | Good |
| Base64 data URIs for images | Report works offline, single file | Good |
| ESM-only with NodeNext | Modern Node.js standard | Good |
| Vitest for testing | Native ESM support, fast | Good |
| ora for spinner | Non-blocking progress, clean CI output | Good |
| Error returns vs throws | Batch operations continue on individual failures | Good |

---
*Last updated: 2026-01-20 after v2.0 milestone started*
