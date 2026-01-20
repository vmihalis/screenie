---
phase: 03-browser-engine
plan: 02
subsystem: engine
tags: [playwright, screenshot, navigation, timeout, buffer]

# Dependency graph
requires:
  - phase: 03-01
    provides: BrowserManager with context creation and cleanup
provides:
  - captureScreenshot function for full-page screenshots
  - Network idle wait before capture
  - Timeout budget split (80% navigation, 20% screenshot)
  - Error handling with ScreenshotResult
affects: [04-page-loading, 05-parallel-execution]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Timeout budget splitting for multi-phase operations
    - Error result pattern (return error vs throw)

key-files:
  created: []
  modified:
    - src/engine/capturer.ts

key-decisions:
  - "Timeout split 80/20 for navigation vs screenshot"
  - "Return error in result instead of throwing"
  - "Use scale: 'css' for consistent file sizes across DPRs"

patterns-established:
  - "Capture function takes manager as parameter for reuse"
  - "Always close context in finally block"
  - "ScreenshotResult discriminated union for success/failure"

# Metrics
duration: 1min
completed: 2026-01-20
---

# Phase 3 Plan 2: Screenshot Capturer Summary

**captureScreenshot function with networkidle wait, full-page capture, 80/20 timeout split, and guaranteed context cleanup**

## Performance

- **Duration:** 1 min
- **Started:** 2026-01-20T01:17:26Z
- **Completed:** 2026-01-20T01:18:38Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Implemented captureScreenshot function satisfying SHOT-01, LOAD-01, LOAD-04
- Network idle wait ensures page fully loaded before capture
- Full-page screenshot captures entire scrollable content
- Timeout budget split prevents hanging on slow pages
- Error handling returns result instead of throwing

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement captureScreenshot function** - `eb250d7` (feat)
2. **Task 2: Update index.ts export** - `a1c9ae0` (chore)

## Files Created/Modified
- `src/engine/capturer.ts` - Screenshot capture with network idle, full-page, timeout handling (66 lines)
- `src/engine/index.ts` - Updated comment for implemented function

## Decisions Made
- **Timeout split 80/20:** Navigation gets 80% of budget (24s for 30s timeout), screenshot gets 20% (6s). Navigation is the slow part; screenshots are fast once page is loaded.
- **Error in result vs throw:** Return ScreenshotResult with error field instead of throwing. Allows batch operations to continue on individual failures.
- **scale: 'css' for screenshots:** Consistent file sizes regardless of device DPR. Images are captured at CSS pixel dimensions, not device pixels.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Browser engine phase complete
- BrowserManager + captureScreenshot ready for page loading phase
- Phase 4 can build URL loading and batch capture logic

---
*Phase: 03-browser-engine*
*Completed: 2026-01-20*
