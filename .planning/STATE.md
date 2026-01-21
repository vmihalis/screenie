# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-21)

**Core value:** Instantly verify that a web app looks correct across all device sizes without manual testing - run one command, review one report.
**Current focus:** v3.0 Viewport-First Capture - Phase 23

## Current Position

Phase: 23 of 23 (Documentation Release) - COMPLETE
Plan: 02 of 02 - COMPLETE
Status: Phase complete - v3.0 ready for npm publish
Last activity: 2026-01-22 - Completed 23-02-PLAN.md

Progress: [█████████░] 100% (v3.0 Viewport-First Capture COMPLETE)

## Performance Metrics

**v3.0 Velocity (COMPLETE):**
- Plans completed: 5
- Total duration: 18min (3min + 8min + 4min + 2min + 1min)
- Phases completed: 3 (Phase 21, Phase 22, Phase 23)

**v2.2 Velocity:**
- Plans completed: 2
- Total duration: ~9min (5min + 4min)
- Phases completed: 2

**Cumulative:**
- Milestones shipped: 5 (v1.0, v2.0, v2.1, v2.2, v3.0)
- Total phases completed: 23
- Total plans completed: 47
- Total days: 2

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.

v3.0 decisions (COMPLETE):
- fullPage defaults to false (viewport-only) - users opt-in to full-page capture
- CLI flag named --full-page (kebab-case) for consistency with existing flags
- Optional boolean pattern: flag presence = true, absence = undefined
- Nullish coalescing pattern for fullPage option (options.fullPage ?? false)
- Dynamic screenshot mode threaded through CLI -> actions -> executor -> capturer
- Fold line removed entirely (viewport-only capture = entire screenshot IS "above the fold")
- Lightbox outputs img directly without wrapper div
- Keep a Changelog 1.0.0 format for version history
- BREAKING CHANGES section with explicit migration examples
- npm version major command for atomic version bumps

v2.2 decisions marked as Good:
- Figlet Big font for ASCII banner
- Commander preAction hook for custom version handling
- Width thresholds: Big/Small/Mini/plain text
- Non-TTY always plain text
- Skip postinstall banner (security anti-pattern)

### Pending Todos

None - all todos resolved.

### Blockers/Concerns

None.

### Tech Debt

From v2.0:
- Custom domain (screenie.xyz) DNS configuration deferred
- Custom domain (docs.screenie.xyz) DNS configuration deferred
- Package name is screenie-tool (npm) but CLI binary runs as screenie

From v2.2:
- Minor: Unused import in commands.ts (generateBanner) - cosmetic only

## Session Continuity

Last session: 2026-01-22
Stopped at: v3.0 COMPLETE - ready for npm publish
Resume file: None

---

*State initialized: 2026-01-21*
*Last updated: 2026-01-22 after v3.0 COMPLETE*
