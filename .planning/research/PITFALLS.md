# Domain Pitfalls: Fold Line Indicators and Interactive Previews

**Domain:** Screenshot report enhancement with CSS overlays and iframe modals
**Researched:** 2026-01-21
**Overall confidence:** HIGH

## Executive Summary

Adding fold line indicators and interactive iframe previews to screenshot reports introduces specific technical challenges around CSS positioning, iframe security/CORS, viewport calculations, and file size management. This document catalogs the critical, moderate, and minor pitfalls discovered through research, with prevention strategies and detection methods for each.

The most critical issues are:
1. **Iframe CORS restrictions** preventing local file protocol loading
2. **CSS positioning context errors** breaking overlay alignment
3. **Base64 data URI performance** degrading with large screenshot files
4. **Mobile viewport height inconsistencies** causing fold line misalignment

---

## Critical Pitfalls

These mistakes cause fundamental feature breakage or major rewrites.

### Pitfall 1: Iframe CORS Blocking with file:// Protocol

**What goes wrong:** Interactive preview modal fails when report is opened as a local file (file:// protocol) trying to load localhost URLs or remote sites in iframe.

**Why it happens:** Modern browsers treat all local files (file:///) as having opaque origins by default. CORS requests may only use HTTP or HTTPS URL schemes. When a self-contained HTML report opened via file:// tries to embed an iframe pointing to http://localhost or https://example.com, the browser blocks it with CORS errors.

**Consequences:**
- Interactive preview feature completely non-functional for local file usage
- Users must run a local web server just to view reports
- Defeats the "self-contained, works offline" design principle
- Error messages are cryptic and unhelpful to end users

**Prevention:**
1. Document clearly that interactive preview only works when report is served via HTTP/HTTPS
2. Add feature detection: Check if `window.location.protocol === 'file:'` and display helpful warning instead of broken iframe
3. Consider fallback: Offer link to "Open URL in new tab" when file:// protocol detected
4. Update README to include instructions for simple HTTP server: `npx serve screenshots/`

**Detection:**
- Warning sign: Testing report by double-clicking HTML file instead of serving via HTTP
- Console errors mentioning "CORS", "file://", or "opaque origins"
- Iframe appearing blank or showing CORS policy error message

**Phase to address:** Phase 3 (Interactive Preview Implementation) - Must be caught during initial development before shipping

**Sources:**
- [MDN: Same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy)
- [MDN: CORS request not HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS/Errors/CORSRequestNotHttp)

---

### Pitfall 2: Forgetting `position: relative` on Parent Container

**What goes wrong:** Fold line overlay positioned absolutely but parent container not set to `position: relative`, causing overlay to position relative to document body instead of the screenshot image.

**Why it happens:** CSS absolute positioning positions elements relative to the nearest ancestor with position set (relative, absolute, fixed, or sticky). If no ancestors have position set, the element positions relative to the document body. This is the single most common mistake with CSS overlays.

**Consequences:**
- Fold line appears in wrong location, often completely off the screenshot
- Fold line doesn't move with screenshot on scroll
- Fold line breaks on responsive layouts or window resize
- Very difficult to debug visually because overlay exists but is misplaced

**Prevention:**
1. Wrap each screenshot image in a container div with `position: relative`
2. Apply fold line overlay as absolute-positioned pseudo-element or child div
3. Create reusable CSS pattern documented in code comments:
   ```css
   .screenshot-container {
     position: relative; /* Critical: establishes positioning context */
   }
   .fold-line {
     position: absolute;
     top: [device.height]px; /* Position at viewport height */
     left: 0;
     right: 0;
   }
   ```
4. Add unit tests verifying parent container has correct position value

**Detection:**
- Warning sign: Fold line visible but not aligned with screenshots
- Inspect element shows fold line positioned far from intended location
- Changing viewport size causes fold line to move independently of image
- Console warning if checking computed styles: `getComputedStyle(parent).position === 'static'`

**Phase to address:** Phase 2 (Fold Line CSS Implementation) - Must be correct from day one

**Sources:**
- [CSS-Tricks: Absolute Positioning Inside Relative Positioning](https://css-tricks.com/absolute-positioning-inside-relative-positioning/)
- [GeeksforGeeks: How to Set Position Absolute but Relative to Parent](https://www.geeksforgeeks.org/css/how-to-set-position-absolute-but-relative-to-parent-in-css/)

---

### Pitfall 3: Using 100vh for Fold Line on Mobile Devices

**What goes wrong:** Fold line positioned using `100vh` to mark viewport height, but on mobile browsers the viewport height changes dynamically as URL bar shows/hides, causing fold line to be positioned incorrectly.

**Why it happens:** Mobile browsers (especially Safari iOS) hide the URL/navigation bar when users scroll down, dynamically resizing the visible viewport. Traditional `100vh` measures the "largest possible viewport" (with URL bar hidden), not the "current viewport" the user actually sees. This creates misalignment between where the fold line renders and where content was actually above-the-fold during capture.

**Consequences:**
- Fold line positioned incorrectly on mobile viewing of report
- Line appears too low (below actual fold) or too high depending on URL bar state
- Makes the fold indicator misleading rather than helpful
- Different behavior across iOS Safari, Chrome mobile, Firefox mobile

**Prevention:**
1. Use exact pixel positioning based on device.height, NOT viewport units
2. For fold line overlays, calculate position as: `top: ${device.height}px` (absolute pixels)
3. Avoid `100vh`, `100lvh`, `100svh` for this use case - pixel-perfect positioning required
4. Document why pixels are used: "Fold line must match exact viewport height at capture time"
5. If dynamic units needed for modal sizing, use `100dvh` (dynamic viewport height) for modals but NOT for static fold lines

**Detection:**
- Warning sign: Fold line looks correct on desktop but wrong on mobile browsers
- Testing on iPhone shows fold line position changes as user scrolls and URL bar hides
- Line position doesn't match device's documented viewport height
- Computed style uses vh units instead of px for critical positioning

**Phase to address:** Phase 2 (Fold Line CSS Implementation) - Must use correct units from start

**Sources:**
- [CSS-Tricks: The trick to viewport units on mobile](https://css-tricks.com/the-trick-to-viewport-units-on-mobile/)
- [Elementor: What Is VH In CSS? 2026 "Viewport Height" Guide](https://elementor.com/blog/vh/)
- [DEV Community: Don't use 100vh for mobile responsive](https://dev.to/nirazanbasnet/dont-use-100vh-for-mobile-responsive-3o97)

---

### Pitfall 4: Base64 Data URI Performance Degradation

**What goes wrong:** HTML report with 50+ base64-encoded screenshots grows to 15-50MB+, causing slow page loads, browser memory issues, and poor performance on mobile devices.

**Why it happens:** Base64 encoding increases file size by approximately 33% over the original binary data. Full-page screenshots at device dimensions (especially desktop/tablet at high DPI) can be 500KB-2MB each. With 57 devices × ~800KB average = ~45MB of image data becoming ~60MB base64 in HTML. Browser must decode all base64 on page load (CPU intensive) and cannot leverage browser caching.

**Consequences:**
- Report HTML file 20-60MB in size
- Page load time 5-15 seconds even on fast connections
- Mobile browsers may crash or become unresponsive
- Cannot cache images between page loads (data URIs aren't cached separately)
- CPU overhead for base64 decoding on every page view
- Data URI mobile performance is 6x slower than source linking

**Prevention:**
1. **Accept the tradeoff**: Document that large reports (50+ devices) will be 20-60MB for self-contained design
2. **Optimize PNG compression**: Ensure screenshots use aggressive PNG compression (current implementation should verify)
3. **Warn users**: Add note in CLI output when report exceeds size threshold (e.g., "Report is 35MB - may load slowly")
4. **Future enhancement**: Offer `--separate-images` flag that writes images as separate files and references via relative paths (trades self-contained for performance)
5. **Lazy loading**: Consider lazy-loading images in lightbox (don't embed full-size data URI until lightbox opened)
6. **Limit thumbnail quality**: Use lower-quality thumbnails in grid, full-quality only in lightbox

**Detection:**
- Warning sign: Report HTML file exceeds 20MB
- Browser DevTools Performance tab shows long "Parse HTML" and script execution time
- Mobile testing shows page load spinners lasting 10+ seconds
- Memory profiling shows high heap usage from large strings

**Phase to address:** Phase 1 (Research & Planning) - Acknowledge as acceptable tradeoff OR Phase 4 (Optimization) if performance is unacceptable in testing

**Sources:**
- [DebugBear: Avoid Large Base64 data URLs in HTML and CSS](https://www.debugbear.com/blog/base64-data-urls-html-css)
- [Catchpoint: On Mobile, Data URIs are 6x Slower than Source Linking](https://www.catchpoint.com/blog/data-uri)
- [MDN: data: URLs](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/data)

---

## Moderate Pitfalls

These mistakes cause delays, technical debt, or user experience issues but are fixable.

### Pitfall 5: Iframe Sandbox Security Not Configured

**What goes wrong:** Interactive preview iframe loads untrusted URLs without sandbox restrictions, creating security vulnerability where malicious JavaScript on previewed site can access parent document or perform unwanted actions.

**Why it happens:** By default, iframes allow full JavaScript execution, form submission, and navigation. If Screenie is used to capture screenshots of untrusted/malicious sites, opening those sites in interactive preview without sandboxing allows the malicious site to potentially access the parent report page or execute attacks.

**Consequences:**
- XSS (Cross-Site Scripting) vulnerability if user previews malicious site
- Malicious iframe could attempt clickjacking or CSRF attacks
- Site in iframe could navigate parent page or open unwanted popups
- Security audits would flag this as vulnerability

**Prevention:**
1. Always use `sandbox` attribute on preview iframe with minimal permissions
2. Recommended sandbox configuration:
   ```html
   <iframe sandbox="allow-scripts allow-same-origin" src="..."></iframe>
   ```
3. Do NOT include `allow-same-origin` and `allow-scripts` together if iframe src has same origin as parent (major security risk)
4. For Screenie's use case (previewing external sites), use:
   ```html
   <iframe sandbox="allow-scripts" src="..."></iframe>
   ```
   (allows site to function but prevents parent access)
5. Document sandbox restrictions in code comments explaining security rationale

**Detection:**
- Warning sign: Iframe element in code without `sandbox` attribute
- Security scanner/linter flags missing iframe sandbox
- Manual testing: Previewed site can access `window.parent` or `window.top`

**Phase to address:** Phase 3 (Interactive Preview Implementation) - Include in initial iframe implementation

**Sources:**
- [Qrvey: 2026 Iframe Security Risks and 10 Ways to Secure Them](https://qrvey.com/blog/iframe-security/)
- [dhiwise: Exploring the iframe Sandbox Attribute](https://www.dhiwise.com/post/iframe-sandbox-attribute-a-secure-embedded-content-solution)
- [WorkOS: Security risks of iframes](https://workos.com/blog/security-risks-of-iframes)

---

### Pitfall 6: Iframe Not Sized to Device Dimensions

**What goes wrong:** Interactive preview modal opens iframe but doesn't set iframe to exact device dimensions (width × height), showing site at arbitrary size instead of the viewport size that was captured.

**Why it happens:** Developers forget the purpose of interactive preview is to simulate the exact viewport environment from the screenshot. Default iframe sizing (100% width, auto height) or arbitrary dimensions don't match the captured device viewport.

**Consequences:**
- Interactive preview shows different layout than screenshot (defeats the purpose)
- Responsive breakpoints trigger differently in preview vs original capture
- Media queries don't match, showing wrong styles
- User confusion: "Why does the interactive preview look different from the screenshot?"

**Prevention:**
1. Set iframe dimensions explicitly to device viewport dimensions:
   ```javascript
   iframe.style.width = `${device.width}px`;
   iframe.style.height = `${device.height}px`;
   ```
2. Account for device pixel ratio if captured at high DPI (may need scaling)
3. Handle overflow: Wrap iframe in scrollable container if device viewport larger than user's screen
4. Show device dimensions in modal UI: "Viewing at 390×844 (iPhone 16 Pro)"
5. Consider zoom controls for large desktop viewports on small user screens

**Detection:**
- Warning sign: Iframe in modal uses percentage or viewport units for dimensions
- Manual testing: Interactive preview layout looks different from screenshot
- Chrome DevTools Device Toolbar shows different dimensions than expected

**Phase to address:** Phase 3 (Interactive Preview Implementation) - Core requirement of the feature

**Sources:**
- [Ben Marshall: Responsive iframes with CSS aspect-ratio](https://benmarshall.me/responsive-iframes/)
- [W3Schools: How To Create Responsive Iframes](https://www.w3schools.com/howto/howto_css_responsive_iframes.asp)

---

### Pitfall 7: Z-Index Conflicts Between Overlays and Modals

**What goes wrong:** Fold line indicators use high z-index values (e.g., 9999), then modal needs even higher z-index to appear above everything, leading to z-index arms race and stacking context issues.

**Why it happens:** Developers reach for very high z-index values (999999) when positioning overlays without understanding CSS stacking contexts. Later additions (like modals) need to stack higher, but stacking contexts prevent simple z-index escalation from working.

**Consequences:**
- Modal appears behind fold lines or other UI elements
- Escalating z-index values throughout codebase (z-index: 999999 antipattern)
- Stacking context bugs difficult to debug
- Future additions require even higher z-index values

**Prevention:**
1. Use CSS custom properties to define z-index scale at root level:
   ```css
   :root {
     --z-index-fold-line: 10;
     --z-index-lightbox: 100;
     --z-index-modal: 200;
   }
   ```
2. Keep z-index values low and meaningful (10, 20, 30 - not 9999)
3. Document stacking order in comments: "Fold lines (10) < Lightbox (100) < Modal (200)"
4. Avoid z-index: 9999 antipattern - usually indicates misunderstanding of stacking contexts
5. Test stacking order: Verify modal appears above all other elements

**Detection:**
- Warning sign: z-index values 9999 or higher in code
- Modal or overlay appears behind other elements
- Need to keep increasing z-index to fix display issues
- DevTools shows multiple elements with extremely high z-index

**Phase to address:** Phase 2 (Fold Line CSS) - Establish z-index scale early

**Sources:**
- [Cloudinary: Image Overlay CSS Guide](https://cloudinary.com/guides/image-effects/image-overlay-css)
- [LogRocket: A guide to image overlays in CSS](https://blog.logrocket.com/css-overlay/)

---

### Pitfall 8: Fold Line Styling Not Visually Distinct

**What goes wrong:** Fold line overlay blends with screenshot content, making it difficult or impossible to see against certain backgrounds or colors.

**Why it happens:** Simple fold line implementation uses single color (e.g., red line) without considering that screenshots contain all possible colors and patterns. A red line invisible against red backgrounds, thin lines disappear at small scale.

**Consequences:**
- Fold line not visible on many screenshots
- Users miss the feature's value because they can't see it
- Complaints that "fold line doesn't work" when it's just invisible
- Need for manual color selection per image (not scalable)

**Prevention:**
1. Use multi-layer approach for maximum visibility:
   ```css
   .fold-line {
     /* Dashed line */
     border-top: 2px dashed rgba(255, 0, 0, 0.8);
     /* Semi-transparent backdrop for contrast */
     background: linear-gradient(
       to bottom,
       rgba(255, 0, 0, 0.1) 0%,
       rgba(255, 0, 0, 0) 100%
     );
     /* Text shadow-like effect for visibility */
     box-shadow:
       0 -1px 0 rgba(255, 255, 255, 0.5),
       0 1px 0 rgba(0, 0, 0, 0.5);
   }
   ```
2. Use contrasting double-border technique:
   ```css
   border-top: 2px solid rgba(255, 255, 255, 0.9);
   border-bottom: 2px solid rgba(0, 0, 0, 0.9);
   ```
3. Add optional label at line end: "← Viewport boundary"
4. Consider animated dash pattern for additional visibility:
   ```css
   border-style: dashed;
   animation: dash 20s linear infinite;
   ```
5. Test against variety of screenshot backgrounds: white, black, photos, text-heavy

**Detection:**
- Warning sign: Fold line invisible on screenshots with certain backgrounds
- User testing shows people don't notice the fold line
- Need to zoom in to see the line clearly
- Line disappears at thumbnail scale in grid view

**Phase to address:** Phase 2 (Fold Line CSS) - Test multiple visual approaches before finalizing

**Sources:**
- [ImageKit: Mastering CSS image overlay - A Practical Guide](https://imagekit.io/blog/css-image-overlay/)
- [Codrops: CSS Overlay Techniques](https://tympanus.net/codrops/2013/11/07/css-overlay-techniques/)

---

### Pitfall 9: Modal Doesn't Handle Device Viewports Larger Than User Screen

**What goes wrong:** Interactive preview modal sets iframe to device dimensions (e.g., 4K desktop: 3840×2160) but user is viewing on laptop (1920×1080), causing modal content to overflow viewport with no way to see full iframe.

**Why it happens:** Device presets include large desktop viewports (4K, ultrawide) that exceed most users' actual screen sizes. Without overflow handling, the iframe gets clipped or pushes modal boundaries off-screen.

**Consequences:**
- User cannot see entire interactive preview for large viewports
- Modal scrollbar appears but doesn't help (iframe itself is clipped)
- Poor UX especially for desktop viewport previews
- Users on small screens cannot effectively use preview feature

**Prevention:**
1. Implement smart scaling for oversized viewports:
   ```javascript
   const maxWidth = window.innerWidth * 0.9;
   const maxHeight = window.innerHeight * 0.9;
   const scale = Math.min(1, maxWidth / device.width, maxHeight / device.height);

   iframe.style.width = `${device.width}px`;
   iframe.style.height = `${device.height}px`;
   iframe.style.transform = `scale(${scale})`;
   iframe.style.transformOrigin = 'top left';
   ```
2. Display actual vs scaled dimensions in modal: "4K Desktop (3840×2160) scaled to 75%"
3. Add zoom controls: "Fit to screen" (auto-scale) vs "100%" (true size with scroll)
4. Wrap iframe in overflow container:
   ```css
   .iframe-container {
     max-width: 90vw;
     max-height: 90vh;
     overflow: auto;
   }
   ```
5. Show visual indicator when preview is scaled down

**Detection:**
- Warning sign: Testing on laptop shows 4K preview cut off
- Modal extends beyond viewport boundaries
- Iframe content clipped with no scrolling mechanism
- Layout breakage when testing large viewport devices

**Phase to address:** Phase 3 (Interactive Preview Implementation) - Should handle in initial modal design

**Sources:**
- [Go Make Things: Responsive iframes with CSS aspect-ratio](https://gomakethings.com/responsive-iframes-with-the-css-aspect-ratio-property/)
- [Cloudinary: Responsive Video Embedding](https://cloudinary.com/guides/video-effects/responsive-video-embedding-embed-video-iframe-size-relative-to-screen-size)

---

## Minor Pitfalls

These mistakes cause annoyance but are easily fixable.

### Pitfall 10: Fold Line Causes Layout Shift on Page Load

**What goes wrong:** Fold line overlay added dynamically causes visible layout shift as page loads, creating janky visual experience.

**Why it happens:** If fold line is added via JavaScript after page render, or CSS applies without reserved space, browser reflows layout causing visible shift. Core Web Vitals penalize layout shifts (Cumulative Layout Shift metric).

**Consequences:**
- Poor user experience with visual jank on page load
- Core Web Vitals score negatively impacted
- Unprofessional appearance of report
- Thumbnails jump around as fold lines render

**Prevention:**
1. Add fold line as pure CSS, not JavaScript injection
2. Use CSS pseudo-elements (::after) on existing containers - no DOM insertion required
3. Reserve space with aspect-ratio on image containers prevents layout shifts
4. Ensure fold line has `position: absolute` (doesn't affect layout flow)
5. Load images with width/height attributes to prevent image-load layout shift

**Detection:**
- Warning sign: Visible "jump" in layout as page loads
- Chrome DevTools Lighthouse reports high CLS score
- Animation/transition effects visible during initial render
- Screenshots in grid shift position after full page load

**Phase to address:** Phase 2 (Fold Line CSS) - Use proper CSS approach to avoid issue

**Sources:**
- [LogRocket: A guide to image overlays in CSS](https://blog.logrocket.com/css-overlay/)
- [ImageKit: CSS image overlay guide](https://imagekit.io/blog/css-image-overlay/)

---

### Pitfall 11: Modal Keyboard Navigation Not Implemented

**What goes wrong:** Interactive preview modal can only be closed by clicking X button, no keyboard shortcut (ESC) or focus management.

**Why it happens:** CSS-only lightbox (current implementation) works via :target pseudo-class without JavaScript. Adding modal with iframe requires JavaScript, but developers forget to implement keyboard navigation.

**Consequences:**
- Accessibility failure (keyboard users cannot close modal easily)
- Poor UX for power users who expect ESC to close modals
- WCAG 2.1 compliance failure
- Keyboard focus trap if not managed properly

**Prevention:**
1. Implement ESC key handler:
   ```javascript
   document.addEventListener('keydown', (e) => {
     if (e.key === 'Escape' && modalOpen) {
       closeModal();
     }
   });
   ```
2. Focus management: Move focus to modal when opened, return to trigger element when closed
3. Focus trap: Keep Tab cycling within modal while open
4. Add visible keyboard hint: "Press ESC to close"
5. Test with keyboard-only navigation (no mouse)

**Detection:**
- Warning sign: Cannot close modal with ESC key
- Tab key moves focus outside of open modal
- Focus lost when modal opens
- Accessibility audit tools flag focus management issues

**Phase to address:** Phase 3 (Interactive Preview Implementation) - Add with initial JavaScript implementation

**Sources:**
- [MDN: Keyboard-navigable JavaScript widgets](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Keyboard-navigable_JavaScript_widgets)
- WCAG 2.1 Success Criterion 2.1.2 (No Keyboard Trap)

---

### Pitfall 12: Inline JavaScript in Data URI Triggers Content Security Policy

**What goes wrong:** If user's environment has strict Content Security Policy (CSP), inline JavaScript for modal functionality may be blocked, breaking the feature.

**Why it happens:** Self-contained HTML file requires inline JavaScript for modal interactivity. Some environments (enterprise, security-conscious deployments) serve HTML with CSP headers blocking inline scripts. Current CSS-only report has no CSP issues, but adding JavaScript creates new vulnerability surface.

**Consequences:**
- Modal functionality completely broken in CSP-restricted environments
- Browser console shows CSP violation errors
- No clear error message to user about why feature doesn't work
- Feature works in development but fails in production environments

**Prevention:**
1. Use nonce-based CSP if possible (requires server cooperation - not applicable to file://)
2. Include feature detection and graceful degradation:
   ```javascript
   try {
     // Modal functionality
   } catch (e) {
     console.warn('Interactive preview disabled due to CSP restrictions');
     // Fallback: Show "Open in new tab" link instead
   }
   ```
3. Document CSP requirements in README
4. Consider making interactive preview optional flag (`--interactive-preview`) that's off by default
5. Provide non-JavaScript fallback: Link to open URL in new tab

**Detection:**
- Warning sign: Console shows "Content Security Policy" errors
- JavaScript does not execute when report opened
- Works locally but fails when deployed/shared
- Enterprise users report feature doesn't work

**Phase to address:** Phase 3 (Interactive Preview Implementation) - Add graceful degradation from start

**Sources:**
- [MDN: Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy)
- [GitHub DOMPurify: Potential for XSS exploit through data uri](https://github.com/cure53/DOMPurify/issues/911)

---

### Pitfall 13: Device Height vs Actual Screenshot Height Mismatch

**What goes wrong:** Fold line positioned at device.height pixels, but actual screenshot is taller due to full-page capture, causing fold line to appear in middle of screenshot rather than marking the viewport boundary.

**Why it happens:** Screenie captures full-page screenshots (entire page height, not just viewport), but fold line should mark where the viewport ended. If page is 3000px tall but viewport was 800px, fold line at 800px is correct, but visually it looks "too high" in the context of the full 3000px screenshot.

**Consequences:**
- Fold line appears too high on page for long scrolling pages
- Confusion about what fold line represents
- Line might be in thumbnail's cropped area (thumbnails show top portion only)
- Feature less useful for pages with significant below-fold content

**Prevention:**
1. Verify device.height matches viewport height used during capture (should be correct already)
2. Add visual context: Label fold line with text overlay "Viewport ended here (first 844px)"
3. In thumbnail view, ensure fold line is visible if screenshot is cropped
4. Document behavior: "Fold line marks viewport boundary, not page bottom"
5. Consider adding page-length visualization in metadata: "Page extends 2200px beyond viewport"

**Detection:**
- Warning sign: Fold line appears "too high" visually on long-scrolling pages
- User testing shows confusion about what fold line represents
- Fold line not visible in thumbnail crops
- Manual measurement shows device.height doesn't match visual fold position

**Phase to address:** Phase 2 (Fold Line CSS) - Verify positioning logic is correct

**Sources:**
- Project context: Screenie's full-page capture vs viewport-only capture distinction
- [MDN: Viewport concepts](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/CSSOM_view/Viewport_concepts)

---

## Phase-Specific Research Flags

Based on pitfalls analysis, here's which phases will likely need deeper research:

| Phase | Likely Research Needs | Rationale |
|-------|----------------------|-----------|
| Phase 1: Research & Planning | LOW - research complete | This document provides comprehensive coverage |
| Phase 2: Fold Line CSS | LOW | Well-understood CSS patterns, main risks identified |
| Phase 3: Interactive Preview | HIGH | Iframe security, CORS, sandbox, sizing all complex topics requiring testing |
| Phase 4: Testing & Refinement | MEDIUM | Need to validate assumptions about file:// limitations, CSP behavior |
| Phase 5: Documentation | LOW | Document known limitations and workarounds |

---

## Testing Checklist

To catch these pitfalls during development:

### Fold Line Testing
- [ ] Fold line visible against white backgrounds
- [ ] Fold line visible against black backgrounds
- [ ] Fold line visible against photo backgrounds
- [ ] Fold line positioned exactly at device.height pixels
- [ ] Fold line doesn't cause layout shift on page load
- [ ] Fold line remains aligned with image on window resize
- [ ] Parent container has `position: relative` set
- [ ] Z-index scale documented and reasonable (no 9999 values)

### Interactive Preview Testing
- [ ] Modal opens when clicking screenshot
- [ ] Iframe loads at exact device dimensions (width × height)
- [ ] Iframe includes `sandbox` attribute with minimal permissions
- [ ] ESC key closes modal
- [ ] Modal works when served via HTTP/HTTPS
- [ ] Clear error/warning when opened as file:// protocol
- [ ] Large viewports (4K) scale down to fit user screen
- [ ] Scaled viewports show scale percentage in UI
- [ ] Focus moves to modal when opened
- [ ] Focus returns to trigger element when modal closes
- [ ] Tab key cycles within modal (focus trap)

### Performance Testing
- [ ] Report HTML file size measured for 57-device capture
- [ ] Page load time measured on fast connection (< 5s acceptable)
- [ ] Page load time measured on mobile 3G (< 15s acceptable)
- [ ] Mobile browser testing (iOS Safari, Chrome Android)
- [ ] Memory usage acceptable (no browser crashes)

### Compatibility Testing
- [ ] Works in Chrome (primary target)
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works on iOS Safari
- [ ] Works on Android Chrome
- [ ] Works with file:// protocol (with expected iframe limitations documented)
- [ ] Works when served via HTTP
- [ ] Works when served via HTTPS
- [ ] CSP restrictions handled gracefully

---

## Summary of Most Critical Risks

1. **CORS/file:// limitations** - Feature completely broken for local file usage unless documented/handled
2. **CSS positioning context** - Wrong or invisible fold lines if positioning not set up correctly
3. **Mobile viewport units** - Fold line misaligned on mobile if using vh units instead of px
4. **Performance** - Unacceptable page load times if base64 optimization not considered

These four risks have the highest probability and highest impact. Address these first.

---

## Sources

### CSS Overlay Positioning
- [Cloudinary: Image Overlay CSS: The Complete Guide](https://cloudinary.com/guides/image-effects/image-overlay-css)
- [LogRocket: A guide to image overlays in CSS](https://blog.logrocket.com/css-overlay/)
- [CSS-Tricks: Positioning Overlay Content with CSS Grid](https://css-tricks.com/positioning-overlay-content-with-css-grid/)
- [ImageKit: Mastering CSS image overlay - A Practical Guide](https://imagekit.io/blog/css-image-overlay/)

### CSS Position Absolute/Relative
- [CSS-Tricks: Absolute Positioning Inside Relative Positioning](https://css-tricks.com/absolute-positioning-inside-relative-positioning/)
- [GeeksforGeeks: How to Set Position Absolute but Relative to Parent in CSS](https://www.geeksforgeeks.org/css/how-to-set-position-absolute-but-relative-to-parent-in-css/)
- [W3Docs: How to Set Absolute Positioning Relative to the Parent Element](https://www.w3docs.com/snippets/css/how-to-set-absolute-positioning-relative-to-the-parent-element.html)

### Mobile Viewport Height
- [CSS-Tricks: The trick to viewport units on mobile](https://css-tricks.com/the-trick-to-viewport-units-on-mobile/)
- [Elementor: What Is VH In CSS? 2026 "Viewport Height" Guide](https://elementor.com/blog/vh/)
- [DEV Community: Don't use 100vh for mobile responsive](https://dev.to/nirazanbasnet/dont-use-100vh-for-mobile-responsive-3o97)

### Iframe Security
- [Qrvey: 2026 Iframe Security Risks and 10 Ways to Secure Them](https://qrvey.com/blog/iframe-security/)
- [MDN: Same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy)
- [WorkOS: Security risks of iframes](https://workos.com/blog/security-risks-of-iframes)
- [dhiwise: Exploring the iframe Sandbox Attribute](https://www.dhiwise.com/post/iframe-sandbox-attribute-a-secure-embedded-content-solution)
- [Google Cloud: iFrame sandbox permissions tutorial](https://cloud.google.com/blog/products/data-analytics/iframe-sandbox-tutorial)

### CORS and File Protocol
- [MDN: CORS request not HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS/Errors/CORSRequestNotHttp)
- [PortSwigger: What is CORS (cross-origin resource sharing)?](https://portswigger.net/web-security/cors)

### Responsive Iframes
- [Ben Marshall: Responsive iframes: Native CSS aspect-ratio Guide](https://benmarshall.me/responsive-iframes/)
- [W3Schools: How To Create Responsive Iframes](https://www.w3schools.com/howto/howto_css_responsive_iframes.asp)
- [Go Make Things: Responsive iframes with CSS aspect-ratio](https://gomakethings.com/responsive-iframes-with-the-css-aspect-ratio-property/)
- [Cloudinary: Responsive Video Embedding](https://cloudinary.com/guides/video-effects/responsive-video-embedding-embed-video-iframe-size-relative-to-screen-size)

### Data URI Performance
- [MDN: data: URLs](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/data)
- [DebugBear: Avoid Large Base64 data URLs in HTML and CSS](https://www.debugbear.com/blog/base64-data-urls-html-css)
- [CSS-Tricks: Data URIs](https://css-tricks.com/data-uris/)
- [Catchpoint: On Mobile, Data URIs are 6x Slower than Source Linking](https://www.catchpoint.com/blog/data-uri)

### Content Security Policy
- [GitHub DOMPurify: Potential for XSS exploit through data uri](https://github.com/cure53/DOMPurify/issues/911)
- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy)
