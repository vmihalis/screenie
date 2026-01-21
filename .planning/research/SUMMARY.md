# Project Research Summary

**Project:** Screenie v2.1 Enhanced Report
**Domain:** Responsive testing tools - HTML report enhancement
**Researched:** 2026-01-21
**Confidence:** HIGH

## Executive Summary

Screenie v2.1 adds two enhancement features to the existing HTML report: fold line indicators and interactive preview modals. Research confirms this is a straightforward enhancement requiring minimal stack additions. The fold line indicator uses pure CSS overlays positioned at viewport height boundaries, while the interactive preview uses HTML `<dialog>` element with minimal vanilla JavaScript (~50-100 lines) for modal control.

The recommended approach leverages existing validated capabilities. No external dependencies are needed. Fold lines position via CSS custom properties and data attributes. Interactive previews use native browser modal APIs with iframe sandboxing for security. All additions are additive (zero breaking changes) and preserve the self-contained property of reports.

Key risks are manageable: iframe CORS limitations when opening reports via file:// protocol (document and provide fallback), CSS positioning context errors (use `position: relative` on parent containers), and mobile viewport height inconsistencies (use pixel positioning, not vh units). The implementation follows established patterns from responsive testing tools like BrowserStack and Chrome DevTools.

## Key Findings

### Recommended Stack

**Minimal stack additions required.** v2.1 builds on existing HTML/CSS/base64 report infrastructure validated in v2.0. Only two new capabilities needed: CSS overlays for fold lines and JavaScript modal control for previews.

**Core technologies:**
- **Pure CSS with data attributes** (fold lines) — Absolute positioning at viewport height using custom properties (`--viewport-height`). Zero JavaScript required for rendering.
- **HTML `<dialog>` element** (modal container) — Native browser modal with 92% browser support (Chrome 37+, Safari 15.4+, Firefox 98+). Built-in accessibility features (focus trap, ESC key).
- **Vanilla JavaScript IIFE module** (modal control) — ~50-100 lines for open/close handlers, iframe sizing, event delegation. No external dependencies, keeps report self-contained.
- **iframe with sandbox attribute** (security) — Loads target URL at device dimensions. Sandbox restricts malicious content (`allow-scripts` only, no popups/navigation).

**Critical decision:** JavaScript is required for modal (not CSS-only) because CSS-only modal solutions either lack browser support (Invoker Commands API: Chrome 135+ only) or cannot handle dynamic iframe sizing (`:target` pseudo-class would need 57 anchors).

### Expected Features

Research analyzed similar tools (BrowserStack, Responsively App, Chrome DevTools) to identify table stakes vs differentiators.

**Must have (table stakes):**
- Horizontal fold line at viewport height with clear, non-intrusive styling
- Device-specific positioning using existing device.height metadata
- Click screenshot to open interactive view (standard pattern in testing tools)
- Iframe loads target URL at exact device dimensions for interaction testing
- Close button (X) + ESC key support for modal UX
- Device metadata display (which device/dimensions being previewed)

**Should have (competitive):**
- Toggle fold lines on/off for clean view vs analytical view
- Keyboard shortcuts (arrow keys) to navigate between devices
- Loading state for iframe (spinner while page loads)
- Direct URL sharing to specific device preview

**Defer (v2+):**
- Device bezels/frames (requires asset library, 8-12 hours effort)
- Side-by-side comparison mode (complex state management, 12-16 hours)
- Synced interactions across devices (very complex, 20-30 hours)
- Touch event simulation (mobile-specific, lower priority)
- Network throttling toggle (complex, DevTools already has this)

### Architecture Approach

All changes occur within `src/output/reporter.ts` (397 lines currently). The existing report generator already has the data needed (viewport height from device presets flows through `Device` → `ExecutionResult` → `ScreenshotForReport`). Integration is purely additive.

**Major components:**
1. **CSS additions (~150 lines)** — Fold line overlay styles, modal container styles, preview button styles. Appended to existing `CSS_STYLES` constant.
2. **HTML template changes** — Modify `renderThumbnailCard()` to add fold line div, data attributes, and preview button. Add modal container template to `buildReportHtml()`.
3. **JavaScript module (~50-100 lines)** — IIFE pattern for namespace isolation. Calculates fold positions on load/resize. Handles modal open/close with iframe sizing.

**Data flow:** Device height already available through existing pipeline. No new data collection needed. Use `data-viewport-height="${height}"` on containers for JavaScript positioning. Use `data-url`, `data-width`, `data-height`, `data-device` on buttons for modal configuration.

**Pattern:** Progressive enhancement. Existing CSS-only lightbox continues working. Fold lines and preview modal are additive features. JavaScript fails gracefully if disabled (buttons visible but non-functional).

### Critical Pitfalls

Research identified 13 pitfalls across critical/moderate/minor severity. Top 5 most impactful:

1. **Iframe CORS blocking with file:// protocol** — Interactive preview fails when report opened as local file trying to load HTTP/HTTPS URLs in iframe. Modern browsers block this with CORS errors. **Mitigation:** Detect `window.location.protocol === 'file:'` and show helpful warning with fallback "Open in new tab" link. Document that interactive preview requires serving via HTTP/HTTPS.

2. **Forgetting `position: relative` on parent container** — Fold line overlay positions relative to document body instead of screenshot if parent lacks positioning context. Most common CSS overlay mistake. **Mitigation:** Wrap screenshots in container with `position: relative`, apply fold line as absolute-positioned child. Document pattern in code comments.

3. **Using 100vh for fold line on mobile devices** — Mobile browsers dynamically resize viewport as URL bar shows/hides. Traditional `100vh` measures "largest possible viewport" not actual current viewport. **Mitigation:** Use exact pixel positioning (`top: ${device.height}px`) not viewport units. Avoids mobile viewport height inconsistencies.

4. **Base64 data URI performance degradation** — 57 screenshots at ~800KB each = ~45MB becoming ~60MB base64 in HTML. Page load 5-15 seconds, mobile browsers may crash. **Mitigation:** Accept tradeoff for self-contained design. Document that large reports will be 20-60MB. Warn users when report exceeds size threshold. Consider lazy-loading or separate images flag in future.

5. **Iframe sandbox security not configured** — Without sandbox restrictions, malicious JavaScript on previewed site could access parent document. **Mitigation:** Always use `<iframe sandbox="allow-scripts">` (NOT `allow-same-origin` with `allow-scripts` together if same origin). Allows site functionality while preventing parent access.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Fold Line Indicator (Pure CSS)
**Rationale:** Independent feature with zero dependencies. Can ship quickly with pure CSS (no JavaScript complexity). Establishes CSS patterns and positioning context for later features.
**Delivers:** Horizontal line overlay at viewport height on all screenshots (thumbnails and lightbox). Label showing viewport height. Responsive positioning on window resize.
**Addresses:** Table stakes feature (fold line visualization). Simple 1-2 hour implementation.
**Avoids:** CSS positioning context pitfall (use `position: relative` on parent), mobile viewport unit pitfall (use pixels not vh), z-index conflict pitfall (establish scale early).

### Phase 2: Interactive Preview Modal
**Rationale:** Builds on validated fold line feature. Adds JavaScript for first time (requires testing). Core value proposition of v2.1.
**Delivers:** Click-to-preview functionality. Modal with iframe sized to device dimensions. Open/close handlers (button, ESC key, backdrop click). Iframe sandbox security.
**Uses:** HTML `<dialog>` element (STACK.md), vanilla JavaScript IIFE module (STACK.md), iframe sandbox attribute (STACK.md).
**Implements:** Modal control architecture component. Handles file:// protocol detection with fallback.
**Avoids:** CORS blocking pitfall (detect and provide fallback), iframe security pitfall (configure sandbox), iframe sizing pitfall (set exact dimensions), large viewport overflow pitfall (scale down to fit user screen).

### Phase 3: Polish & Edge Cases
**Rationale:** Core features stable, now handle responsive behavior and accessibility. Refinements based on testing feedback.
**Delivers:** Loading states for iframe. Keyboard navigation polish (focus management, Tab cycling). Accessibility attributes (ARIA labels). Handle oversized viewports (4K on laptop screens). Error messaging improvements.
**Addresses:** Should-have features (keyboard shortcuts, loading states). Minor pitfalls (layout shift, keyboard navigation, CSP graceful degradation).

### Phase Ordering Rationale

- **Phase 1 first** because fold line is independent, pure CSS (low risk), and validates positioning patterns used in Phase 2. Quick win establishes foundation.
- **Phase 2 next** because it's the core value proposition but requires JavaScript (higher complexity). Building on stable Phase 1 reduces risk.
- **Phase 3 last** because polish depends on core features working. Testing reveals edge cases that inform refinements.

This ordering follows dependencies discovered in research: fold line overlay positioning establishes patterns → modal builds on those patterns → polish handles discovered edge cases.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Interactive Preview):** HIGH research need. Iframe security, CORS behavior, sandbox attribute testing all require validation with actual URLs. Test with common frameworks (Next.js, WordPress) to verify CORS handling. Validate file:// protocol limitations with multiple browsers.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Fold Line):** LOW research need. Pure CSS absolute positioning is well-documented. CSS custom properties and data attributes have excellent browser support since IE11/2012.
- **Phase 3 (Polish):** MEDIUM research need. Accessibility patterns are well-documented (WCAG 2.1, MDN). May need testing to verify specific implementations but patterns are established.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies have 90%+ browser support. Official MDN documentation for all patterns. Vanilla JavaScript eliminates dependency risks. |
| Features | MEDIUM | Table stakes identified from established tools (BrowserStack, DevTools). Some uncertainty on differentiators (bezels, side-by-side) - defer to v2.2+. |
| Architecture | HIGH | Integration points clear from codebase analysis. Data pipeline already validated. All changes additive (zero breaking changes). Only 1 file modified. |
| Pitfalls | HIGH | 13 pitfalls identified with prevention strategies. Critical risks (CORS, positioning, viewport units, performance) have clear mitigations. |

**Overall confidence:** HIGH

Research based on official documentation (MDN), established tool analysis (BrowserStack, Responsively App, Chrome DevTools), and existing codebase validation. Stack decisions verified with Can I use browser support data. Architecture integration validated by reading actual `src/output/reporter.ts` implementation.

### Gaps to Address

**File:// protocol iframe limitations:** Research confirms CORS blocking but exact behavior may vary by browser/security settings. Needs testing during Phase 2 implementation to determine best fallback UX. Consider: "Open in new tab" link vs "Serve report via HTTP" instructions vs disable feature entirely on file://.

**Base64 performance threshold:** Research indicates 20-60MB reports will be slow but exact threshold where UX becomes unacceptable is unclear. Needs performance testing during Phase 1 with actual 57-device captures to determine if optimization is required or acceptable tradeoff.

**Device bezel asset sourcing:** Deferred to v2.2+ but if prioritized, need to research free/open-source device frame libraries (frameme, device_frame Flutter). Didn't verify availability or licensing.

**Fold line color/style preference:** Research suggests red (standard danger/boundary indicator) but user preference unknown. Consider quick survey with 5-10 users during Phase 1 testing to validate visibility/style choices.

## Sources

### Primary (HIGH confidence)
- **MDN Web Docs** — CSS positioning, dialog element, iframe sandbox, data attributes, viewport concepts. Official browser standards documentation.
- **Can I use** — Browser support verification for dialog element (92%), CSS custom properties (100%), data attributes (100%).
- **Screenie codebase** — `src/output/reporter.ts`, `src/output/types.ts`, `src/devices/types.ts`. Direct analysis of existing architecture and data structures.

### Secondary (MEDIUM confidence)
- **BrowserStack responsive testing guides** — Expected features analysis, table stakes identification.
- **Chrome DevTools documentation** — Device mode patterns, viewport testing UX.
- **Responsively App** — Feature comparison for differentiators (side-by-side mode, synced interactions).
- **CSS-Tricks** — CSS overlay techniques, absolute positioning patterns, data URI performance considerations.

### Tertiary (LOW confidence)
- **Community blog posts** — Modal patterns (w3bits, websemantics), responsive iframe techniques. Used for pattern validation, verified against primary sources.
- **DebugBear/Catchpoint performance articles** — Base64 data URI performance impact (6x slower on mobile). Single-source claims, needs validation through testing.

---
*Research completed: 2026-01-21*
*Ready for roadmap: yes*
