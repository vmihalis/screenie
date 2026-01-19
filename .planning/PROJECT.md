# Responsive Screenshot Tool

## What This Is

A CLI tool that automates responsive design testing by capturing screenshots of a web page across 50+ device dimensions. It organizes screenshots into device categories (phones, tablets, PC/laptops) and generates an HTML report for quick visual review. Built to eliminate the tedious manual process of checking layouts in Chrome DevTools after every commit.

## Core Value

Instantly verify that a web app looks correct across all device sizes without manual testing — run one command, review one report.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Accept URL (localhost or remote) and page path as input
- [ ] Capture full-page screenshots at 50+ device dimensions
- [ ] Organize screenshots into phones/, tablets/, pc-laptops/ folders
- [ ] Generate HTML report with grid view of all screenshots
- [ ] Run captures in parallel for speed
- [ ] Wait for network idle + buffer before capturing
- [ ] Use Chrome via Playwright for rendering

### Out of Scope

- Authentication handling — deferred, user will handle separately
- Multi-page crawling — single page per run, user specifies path
- Cross-browser testing (Firefox/Safari) — Chrome only for now
- Screenshot diffing/comparison between runs — potential v2 feature
- CI/CD integration — manual invocation for now

## Context

- User's workflow: make changes to web app, commit, run this tool, review screenshots
- Primary pain point: manually resizing Chrome DevTools for every device is slow and tedious
- Output needs to support quick scanning — hence HTML report over folder browsing
- Parallel execution important for keeping runtime under 1 minute for 50+ devices

## Constraints

- **Tech stack**: Node.js + Playwright (Chromium) — mature, well-documented, handles parallel execution well
- **Performance**: Should complete 50+ screenshots in under 1 minute via parallelization
- **Page timing**: Network idle detection + 500ms buffer, 30s max timeout

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Full-page screenshots (not viewport-only) | Catch layout issues anywhere on page, not just above fold | — Pending |
| Playwright over Puppeteer | Better API, built-in device emulation, active maintenance | — Pending |
| HTML report over folder browsing | Scanning 50+ images in grid is faster than opening files | — Pending |
| Parallel execution | 50 devices sequentially = 2-3 min; parallel = 30-40 sec | — Pending |

---
*Last updated: 2025-01-20 after initialization*
