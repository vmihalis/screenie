# Stack Research: Screenie v2.1 - Fold Indicators & Interactive Previews

**Project:** screenie (responsive screenshot CLI)
**Researched:** 2026-01-21
**Scope:** Fold line indicators and interactive preview modals for self-contained HTML report
**Type:** SUBSEQUENT MILESTONE - Additions to existing validated capabilities

---

## Executive Summary

For v2.1's fold indicators and interactive preview modals, **minimal stack additions** are required. The implementation leverages existing HTML/CSS patterns with a small, self-contained JavaScript module (~50-100 lines) for modal functionality.

**Key Decision:** Use JavaScript for modal control (not CSS-only) because browser support for CSS-only modal solutions (Invoker Commands API) is insufficient in 2026.

---

## Existing Stack (Validated - DO NOT Change)

Current report.html capabilities:
- ✅ Full-page screenshots with Playwright
- ✅ HTML report generation with CSS Grid layout
- ✅ CSS-only lightbox for image enlargement (`:target` pseudo-class)
- ✅ Base64 embedded images
- ✅ Self-contained HTML (works offline)
- ✅ Zero external dependencies

**Source:** `/home/memehalis/responsiveness-mcp/src/output/reporter.ts`

---

## v2.1 Stack Additions

### 1. Fold Line Indicators

**Technology:** Pure CSS with data attributes

**Implementation:** CSS overlay positioned at exact viewport height

```css
.screenshot-container {
  position: relative;
  display: inline-block;
}

.fold-line {
  position: absolute;
  top: var(--viewport-height);
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(255, 0, 0, 0.7);
  box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
  pointer-events: none;
  z-index: 10;
}

.fold-line::before {
  content: 'FOLD (' attr(data-viewport-height) 'px)';
  position: absolute;
  right: 8px;
  top: -20px;
  background: rgba(255, 0, 0, 0.9);
  color: white;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 3px;
}
```

**HTML Structure:**
```html
<div class="screenshot-container" style="--viewport-height: 844px;">
  <img src="data:image/png;base64,..." alt="iPhone 14">
  <div class="fold-line" data-viewport-height="844"></div>
</div>
```

**Why this approach:**
- **CSS Custom Properties** (`--viewport-height`) allow dynamic positioning per device
- **`attr()` function** displays viewport height in label (supported since IE8)
- **Absolute positioning** ensures pixel-perfect placement relative to screenshot
- **No JavaScript required** for rendering
- **Data attributes** store viewport height for label display

**Sources:**
- [MDN: Using CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [MDN: CSS attr() function](https://developer.mozilla.org/en-US/docs/Web/CSS/attr)
- [CSS Position Property 2026 Guide](https://elementor.com/blog/css-layout-the-position-property/)
- [Working with data attributes in CSS](https://dev.to/dailydevtips1/working-with-data-attributes-in-css-280l)

**Confidence:** HIGH - Standard CSS techniques, excellent browser support

---

### 2. Interactive Preview Modal

**Technology:** HTML `<dialog>` element with minimal JavaScript

**Why JavaScript is Required:**

CSS-only modal solutions exist but have critical limitations for this use case:

| Approach | Status in 2026 | Verdict |
|----------|---------------|---------|
| `:target` pseudo-class | Widely supported | ❌ **Cannot handle dynamic iframe sizing** - Would require one anchor per device dimension (57 total), cluttering URLs |
| `<details>` element | Widely supported | ❌ **Not a true modal** - Doesn't prevent interaction with page, no backdrop |
| Checkbox hack | Widely supported | ❌ **Not accessible** - Violates semantic HTML, poor screen reader support |
| Invoker Commands API (`commandfor`/`command`) | **Chrome 135+ only** (March 2025) | ❌ **Insufficient browser support** - Safari unsupported, Firefox unsupported |

**Recommendation:** Use native `<dialog>` element with JavaScript for `showModal()`.

**Browser Support (2026):**
- Chrome 37+ ✅
- Edge 79+ ✅
- Safari 15.4+ ✅
- Firefox 98+ ✅
- **Compatibility score: 92%** (all modern browsers)

**Sources:**
- [Can I use: Dialog element](https://caniuse.com/dialog)
- [MDN: HTMLDialogElement.showModal()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal)
- [Chrome Developer Blog: Introducing command and commandfor](https://developer.chrome.com/blog/command-and-commandfor)
- [MDN: Invoker Commands API](https://developer.mozilla.org/en-US/docs/Web/API/Invoker_Commands_API)

**Confidence:** HIGH - Dialog element has excellent browser support, JavaScript requirement is minimal

---

### JavaScript Module Structure

**File:** Inline `<script>` in report.html (keeps self-contained property)

**Size:** ~50-100 lines

**Functionality:**
```javascript
// Scoped module pattern - no global pollution
(function() {
  'use strict';

  // Modal controller
  class PreviewModal {
    constructor(dialog) {
      this.dialog = dialog;
      this.iframe = dialog.querySelector('iframe');
      this.bindEvents();
    }

    open(url, width, height, deviceName) {
      // Set iframe dimensions to exact device viewport
      this.iframe.src = url;
      this.iframe.style.width = width + 'px';
      this.iframe.style.height = height + 'px';

      // Update modal title
      this.dialog.querySelector('.modal-title').textContent = deviceName;

      // Show modal (native browser modal with backdrop)
      this.dialog.showModal();
    }

    close() {
      this.dialog.close();
      // Clear iframe to stop loading
      this.iframe.src = 'about:blank';
    }

    bindEvents() {
      // Close on backdrop click
      this.dialog.addEventListener('click', (e) => {
        if (e.target === this.dialog) this.close();
      });

      // Close on Escape (native dialog behavior, but also manual)
      this.dialog.addEventListener('close', () => {
        this.iframe.src = 'about:blank';
      });

      // Close button
      this.dialog.querySelector('.close-btn').addEventListener('click', () => {
        this.close();
      });
    }
  }

  // Initialize on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    const dialog = document.getElementById('preview-modal');
    const modal = new PreviewModal(dialog);

    // Attach to all preview buttons
    document.querySelectorAll('[data-preview]').forEach(button => {
      button.addEventListener('click', () => {
        const { url, width, height, device } = button.dataset;
        modal.open(url, parseInt(width), parseInt(height), device);
      });
    });
  });
})();
```

**Why this structure:**
- **IIFE (Immediately Invoked Function Expression)** prevents global namespace pollution
- **Class-based** for clear organization (supported in all browsers with dialog support)
- **Event delegation** for efficient memory usage
- **Native dialog methods** (`showModal()`, `close()`) for accessibility
- **Cleanup on close** (clearing iframe src) prevents background resource usage

**Confidence:** HIGH - Standard JavaScript patterns, no dependencies

---

### HTML Structure for Modal

```html
<dialog id="preview-modal" class="preview-modal">
  <div class="modal-header">
    <h3 class="modal-title">Preview</h3>
    <button class="close-btn" aria-label="Close">&times;</button>
  </div>
  <div class="modal-body">
    <iframe
      sandbox="allow-same-origin allow-scripts allow-forms"
      title="Interactive preview"
      loading="lazy">
    </iframe>
  </div>
</dialog>

<!-- Preview buttons in thumbnail cards -->
<div class="thumbnail-card">
  <a href="#lightbox-id" class="thumbnail-link">
    <img src="data:..." alt="iPhone 14">
  </a>
  <div class="thumbnail-info">
    <div class="device-name">iPhone 14</div>
    <div class="dimensions">390 x 844</div>
    <button
      class="preview-btn"
      data-preview
      data-url="https://example.com"
      data-width="390"
      data-height="844"
      data-device="iPhone 14">
      Live Preview
    </button>
  </div>
</div>
```

**Why data attributes:**
- **Declarative configuration** - All device info in HTML, not hardcoded in JS
- **Type safety** - JavaScript reads structured data, not parsing text
- **Maintainability** - Easy to generate from TypeScript when building report

**Source:** [MDN: Using data attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/Use_data_attributes)

**Confidence:** HIGH - Standard HTML5 practice

---

### CSS for Modal

```css
/* Dialog (native browser modal) */
.preview-modal {
  border: none;
  border-radius: 8px;
  padding: 0;
  max-width: 95vw;
  max-height: 90vh;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.preview-modal::backdrop {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-body {
  padding: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: auto;
}

.preview-modal iframe {
  border: 2px solid #ddd;
  background: white;
  /* Dimensions set via JavaScript based on device */
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.preview-btn {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  width: 100%;
}

.preview-btn:hover {
  background: #45a049;
}
```

**Why this styling:**
- **`::backdrop`** - Native pseudo-element for modal backdrop (supported with dialog)
- **`backdrop-filter: blur()`** - Modern effect, degrades gracefully
- **Flexible sizing** - Modal adapts to iframe content (device dimensions)
- **Overflow handling** - Larger viewports (desktop) scroll within modal

**Sources:**
- [MDN: ::backdrop pseudo-element](https://developer.mozilla.org/en-US/docs/Web/CSS/::backdrop)
- [How to Style HTML Dialog Element](https://www.testmu.ai/blog/html-dialog-element/)

**Confidence:** HIGH - Standard dialog styling patterns

---

### iframe Security Considerations

**Sandbox Attribute:** Use restrictive sandbox with minimum permissions

```html
<iframe sandbox="allow-same-origin allow-scripts allow-forms"></iframe>
```

**Why these permissions:**
- `allow-same-origin` - Required to load the URL being tested (same URL user provided to Screenie)
- `allow-scripts` - Required for modern web apps to function
- `allow-forms` - Allows form interaction in preview

**Explicitly NOT allowing:**
- `allow-popups` - Prevents annoying popups during preview
- `allow-top-navigation` - Prevents iframe from hijacking parent window
- `allow-modals` - Prevents iframe from creating alerts/confirms

**Additional Security Headers (for hosted reports):**

If reports are hosted (not just opened locally), set CSP headers:
```
Content-Security-Policy: frame-ancestors 'self'
X-Frame-Options: SAMEORIGIN
```

**Why NOT needed for Screenie:**
Screenie generates local HTML files, not hosted web apps. The iframe loads external sites for preview, so:
- CSP would block the preview functionality
- X-Frame-Options doesn't apply (we're the parent, not the child)

**Real Security Consideration:**
The iframe loads **user-provided URLs** (the URL they screenshotted). This is equivalent to opening a browser tab - the user already trusts this URL. Sandbox restrictions prevent the preview from affecting the report page.

**Sources:**
- [2026 Iframe Security Risks and Best Practices](https://qrvey.com/blog/iframe-security/)
- [MDN: Content-Security-Policy sandbox](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/sandbox)
- [A Comprehensive Guide to Implementing iframe Sandbox](https://www.dhiwise.com/post/iframe-sandbox-attribute-a-secure-embedded-content-solution)

**Confidence:** HIGH - Sandbox is well-documented security feature

---

## TypeScript Integration

**Update:** `src/output/types.ts`

Add viewport height to `ScreenshotForReport`:

```typescript
export interface ScreenshotForReport {
  deviceName: string;
  category: DeviceCategory;
  width: number;        // Already exists (viewport width)
  height: number;       // Already exists (viewport height)
  dataUri: string;      // Already exists (base64 image)
  viewportHeight: number; // NEW - for fold line positioning
}
```

**Note:** `height` already exists in Device interface and represents viewport height. The `viewportHeight` field would be redundant. Instead, use existing `height` field directly.

**Correction:**
```typescript
// No changes needed to ScreenshotForReport interface
// Use existing `height` field for fold line positioning
```

**Update:** `src/output/reporter.ts`

Add URL to report data for preview functionality:

```typescript
export interface ReportData {
  url: string;          // Already exists!
  capturedAt: string;
  duration: number;
  deviceCount: number;
  files: FileInfo[];
}
```

**No TypeScript changes required** - Existing types already contain necessary data.

**Confidence:** HIGH - Minimal integration, leverages existing structure

---

## Implementation Checklist

### Phase 1: Fold Line Indicators (Pure CSS)
- [ ] Add CSS for `.fold-line` overlay
- [ ] Add CSS custom property `--viewport-height` per screenshot container
- [ ] Update `renderThumbnailCard()` to wrap images in positioned container
- [ ] Update `renderLightbox()` to include fold line in full-size view
- [ ] Use `device.height` from existing data (no new fields)

### Phase 2: Preview Modal (HTML + JS)
- [ ] Add `<dialog>` element to HTML template
- [ ] Add modal CSS (dialog, backdrop, iframe styles)
- [ ] Add inline `<script>` module (~50-100 lines)
- [ ] Update `renderThumbnailCard()` to add preview button with data attributes
- [ ] Pass `data.url` to preview buttons (already available in ReportData)

### Phase 3: Testing
- [ ] Test fold line positioning accuracy across all 57 devices
- [ ] Test modal functionality with various viewport sizes
- [ ] Test iframe security (sandbox restrictions)
- [ ] Verify self-contained property (no external requests)
- [ ] Test offline functionality (file:// protocol)

---

## What NOT to Add

### ❌ External JavaScript Libraries
**Why:** Breaks self-contained property, adds network dependency, increases file size

**Considered and rejected:**
- React/Vue for modal - Massive overkill, breaks offline mode
- jQuery - Unnecessary for modern browsers with dialog support
- Modal libraries (Bootstrap Modal, etc.) - Native dialog is sufficient

### ❌ Complex State Management
**Why:** Single modal with simple open/close doesn't need Redux/Zustand/etc.

### ❌ iframe Alternatives
**Why:** Canvas/screenshot embedding loses interactivity (the point of the feature)

**Considered:**
- Embed another screenshot - Defeats purpose (already have static screenshot)
- Open in new window - Breaks workflow, loses modal context
- Inline preview - Can't show exact device dimensions

### ❌ CSS Frameworks
**Why:** ~50 lines of custom CSS vs 100KB+ framework

**Considered and rejected:**
- Tailwind CSS - Requires build step, bloats inline styles
- Bootstrap - 200KB+ for one modal, unnecessary
- Custom components via Web Components - Overkill for single use case

### ❌ TypeScript Compilation for Inline JS
**Why:** Keep inline JS simple ES6+, no build step for report generation

**Approach:**
- Write TypeScript in `src/output/reporter.ts` to generate HTML
- Inline JS in HTML is vanilla ES6+ (no compilation needed)
- TypeScript generates the HTML strings containing JS

---

## File Size Impact

**Current report.html:** ~50-55MB (base64 images dominate)

**v2.1 additions:**
- Fold line CSS: ~1KB
- Modal CSS: ~2KB
- Modal HTML: ~0.5KB
- Inline JavaScript: ~4KB (minified)
- **Total addition: ~7.5KB**

**Percentage increase:** ~0.014% (negligible)

**Confidence:** HIGH - CSS/JS additions are tiny compared to base64 images

---

## Accessibility Considerations

### Fold Line
- ✅ Purely visual indicator, doesn't affect accessibility tree
- ✅ Label text ("FOLD") provides context in screenshots
- ✅ No interactive elements, no ARIA needed

### Preview Modal
- ✅ Native `<dialog>` has built-in accessibility
  - Focus trap (can't tab outside modal)
  - Escape key closes (native behavior)
  - Screen readers announce as modal dialog
- ✅ Close button has `aria-label="Close"`
- ✅ iframe has descriptive `title` attribute
- ⚠️ **Consider:** Add `aria-describedby` to iframe explaining it's a live preview

**Enhanced accessibility:**
```html
<dialog id="preview-modal" aria-labelledby="modal-title">
  <div class="modal-header">
    <h3 id="modal-title" class="modal-title">Live Preview: [Device Name]</h3>
    <button class="close-btn" aria-label="Close preview">×</button>
  </div>
  <div class="modal-body">
    <iframe
      sandbox="allow-same-origin allow-scripts allow-forms"
      title="Interactive preview of website at device dimensions"
      aria-describedby="preview-description">
    </iframe>
    <div id="preview-description" hidden>
      This is a live, interactive preview of the website displayed at exact device dimensions.
    </div>
  </div>
</dialog>
```

**Sources:**
- [MDN: ARIA dialog role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/dialog_role)
- [A11y Dialog Element Documentation](https://a11y-dialog.netlify.app/further-reading/dialog-element/)

**Confidence:** HIGH - Native dialog element provides excellent baseline accessibility

---

## Responsive Iframe Sizing

**Challenge:** Modal needs to display iframe at exact device dimensions while fitting within various viewport sizes.

**Solution:** CSS containment with scroll

```css
.modal-body {
  max-width: 95vw;
  max-height: 70vh;
  overflow: auto;
  padding: 1rem;
}

.preview-modal iframe {
  /* Exact dimensions set via JavaScript */
  width: var(--device-width, 390px);
  height: var(--device-height, 844px);
  border: 2px solid #ddd;
  display: block;
}
```

**Behavior:**
- Desktop (large viewport): Modal shows full device dimensions, no scrolling
- Tablet/Mobile (small viewport): Modal scrolls to show full device preview

**Why NOT scale iframe:**
Scaling defeats the purpose - users want to see exact device dimensions, not scaled approximations.

**Alternative considered:** Use CSS `transform: scale()` for small viewports
- ❌ **Rejected:** Users specifically want to test at exact dimensions
- ❌ **Rejected:** Scaling creates confusion (not true device experience)

**Sources:**
- [Responsive iframes: Native CSS aspect-ratio](https://benmarshall.me/responsive-iframes/)
- [How to Fit Content on Iframe: Complete Guide](https://copyprogramming.com/howto/html-css-how-to-fit-the-iframe-content-to-the-iframe)

**Confidence:** HIGH - Standard iframe containment pattern

---

## Browser Compatibility Summary

| Feature | Technique | Browser Support | Fallback Needed |
|---------|-----------|----------------|-----------------|
| Fold line | CSS absolute positioning + custom properties | IE11+ (100%) | No |
| Data attributes | `attr()` in CSS | IE8+ (100%) | No |
| Dialog element | Native `<dialog>` | Chrome 37+, Safari 15.4+, Firefox 98+ (92%) | No* |
| Backdrop | `::backdrop` pseudo-element | Same as dialog | No |
| Backdrop blur | `backdrop-filter` | Chrome 76+, Safari 9+ | Yes** |
| Sandbox | iframe `sandbox` attribute | All modern browsers | No |

**Notes:**
- *No fallback needed: Report targets modern browsers (Playwright screenshots are for modern web dev)
- **Backdrop blur gracefully degrades to solid backdrop (no functionality lost)

**Minimum browser requirements for v2.1 features:**
- Chrome 76+
- Safari 15.4+
- Firefox 98+
- Edge 79+

**Confidence:** HIGH - Target browsers align with Playwright's browser targets (modern web developers)

---

## Performance Considerations

### Initial Load
- ✅ Fold lines: Zero performance impact (pure CSS)
- ✅ Modal: Zero performance impact (hidden `<dialog>` not in layout)
- ✅ JavaScript: ~4KB parsed once on DOMContentLoaded
- ✅ Base64 images: Already largest factor (unchanged)

### Runtime Performance
- ✅ Modal open: Single DOM manipulation + iframe load
- ✅ Modal close: Clear iframe src (stop network requests)
- ✅ Preview buttons: Event listeners attached once (not re-bound)

### Memory Usage
- ⚠️ iframe: ~50MB per preview (full page render)
  - **Mitigation:** Clear iframe on close (memory released)
  - **Mitigation:** Only one iframe (reused for all previews)

**Worst case:** User opens 10 previews in rapid succession
- Without cleanup: ~500MB memory usage
- With cleanup (implemented): ~50MB (one iframe reused)

**Confidence:** HIGH - Standard performance patterns, minimal overhead

---

## Testing Strategy

### Unit Tests (Not Needed)
Modal functionality is DOM-based, not business logic. E2E tests more appropriate.

### Manual Testing Checklist
1. **Fold lines:**
   - [ ] Line appears at correct viewport height for all 57 devices
   - [ ] Label shows correct viewport height
   - [ ] Line visible in both thumbnail and lightbox views
   - [ ] No layout shift when fold line added

2. **Preview modal:**
   - [ ] Modal opens on button click
   - [ ] Iframe loads at correct dimensions
   - [ ] Modal closes on backdrop click
   - [ ] Modal closes on Escape key
   - [ ] Modal closes on close button
   - [ ] Iframe stops loading when modal closes
   - [ ] Multiple previews work (modal reused)

3. **Security:**
   - [ ] Sandbox prevents popups
   - [ ] Sandbox prevents top navigation
   - [ ] Preview loads user-provided URL correctly

4. **Offline mode:**
   - [ ] Report opens via file:// protocol
   - [ ] Fold lines render (no external CSS)
   - [ ] Modal opens (no external JS)
   - [ ] Preview loads (requires network for URL, expected)

**Confidence:** HIGH - Straightforward manual testing, no complex scenarios

---

## Migration Impact

**Breaking changes:** NONE

**Additive changes only:**
- Fold lines appear automatically (opt-out not needed)
- Preview buttons added to thumbnail cards (doesn't remove existing lightbox)

**Backward compatibility:**
- Existing lightbox functionality unchanged
- Users can still use lightbox for full-size screenshots
- Preview modal is additional functionality, not replacement

**Confidence:** HIGH - Purely additive features, zero breaking changes

---

## Stack Summary Table

| Component | Technology | Why | Size Impact | Confidence |
|-----------|-----------|-----|-------------|------------|
| Fold Line Indicator | CSS absolute positioning + custom properties | Pixel-perfect positioning, no JS needed | ~1KB | HIGH |
| Fold Line Label | CSS `attr()` with data attributes | Display viewport height dynamically | <1KB | HIGH |
| Preview Modal Container | Native HTML `<dialog>` | Best accessibility, native focus trap | ~0.5KB HTML | HIGH |
| Modal Control | Vanilla JavaScript (IIFE module) | Minimal deps, full browser support | ~4KB | HIGH |
| Modal Styling | Custom CSS | Lightweight, semantic | ~2KB | HIGH |
| iframe Security | HTML `sandbox` attribute | Standard security practice | 0KB | HIGH |
| iframe Sizing | JavaScript-set inline styles | Dynamic per-device dimensions | 0KB | HIGH |

**Total addition: ~7.5KB** (0.014% increase over base64 images)

---

## Open Questions

1. **Fold line color/style:** Use red (standard) or match brand color?
   - **Recommendation:** Red (universal "danger/boundary" indicator)

2. **Preview button placement:** Inside thumbnail card or separate row?
   - **Recommendation:** Inside thumbnail card (proximity to screenshot)

3. **Modal close behavior:** Clear iframe immediately or wait for animation?
   - **Recommendation:** Clear immediately (stop network requests ASAP)

4. **Fold line in lightbox:** Show fold line in full-size lightbox view?
   - **Recommendation:** YES (consistency, users often want to measure fold in full-size)

5. **Preview URL handling:** What if URL requires auth/cookies?
   - **Answer:** iframe loads in separate context (no cookies). Expected limitation.
   - **Documentation needed:** Note that previews don't preserve auth state

---

## Documentation Requirements

### User-Facing Documentation (docs site)
1. **Fold line explanation:**
   - What the fold line represents (viewport height boundary)
   - Why it matters (above-the-fold content visibility)

2. **Preview functionality:**
   - How to open preview (click "Live Preview" button)
   - What preview shows (exact device dimensions, interactive)
   - Limitations (no auth state, requires network)

3. **Browser requirements:**
   - Modern browsers (Chrome 76+, Safari 15.4+, Firefox 98+)
   - Offline mode limitations (preview requires network)

### Developer Documentation (inline comments)
1. Modal JavaScript module - document class methods
2. CSS custom properties - document `--viewport-height` usage
3. Data attributes - document expected structure

**Confidence:** MEDIUM-HIGH - Documentation scope is clear, execution details TBD

---

## Final Recommendation

**Proceed with implementation using:**
- ✅ Pure CSS for fold line indicators
- ✅ Native `<dialog>` element for modal
- ✅ Minimal vanilla JavaScript (~50-100 lines)
- ✅ iframe with `sandbox` attribute for security
- ✅ Data attributes for configuration
- ✅ Inline CSS/JS to preserve self-contained property

**Do NOT use:**
- ❌ External libraries (React, jQuery, etc.)
- ❌ CSS frameworks (Tailwind, Bootstrap)
- ❌ CSS-only modal (insufficient browser support for Invoker Commands)
- ❌ Build steps for inline JavaScript

**Confidence:** HIGH - All recommendations based on verified browser support and best practices

---

## Sources

### Browser Support & Standards
- [Can I use: Dialog element](https://caniuse.com/dialog)
- [MDN: HTMLDialogElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement)
- [MDN: HTMLDialogElement.showModal()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal)
- [Chrome Developer Blog: Introducing command and commandfor](https://developer.chrome.com/blog/command-and-commandfor)
- [MDN: Invoker Commands API](https://developer.mozilla.org/en-US/docs/Web/API/Invoker_Commands_API)

### CSS Techniques
- [CSS Layout: The Position Property 2026 Guide](https://elementor.com/blog/css-layout-the-position-property/)
- [MDN: Using CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [Working with data attributes in CSS](https://dev.to/dailydevtips1/working-with-data-attributes-in-css-280l)
- [MDN: CSS attr() function](https://developer.mozilla.org/en-US/docs/Web/CSS/attr)
- [MDN: ::backdrop pseudo-element](https://developer.mozilla.org/en-US/docs/Web/CSS/::backdrop)

### Security
- [2026 Iframe Security Risks and Best Practices](https://qrvey.com/blog/iframe-security/)
- [MDN: Content-Security-Policy sandbox](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/sandbox)
- [A Comprehensive Guide to Implementing iframe Sandbox](https://www.dhiwise.com/post/iframe-sandbox-attribute-a-secure-embedded-content-solution)

### Accessibility
- [MDN: ARIA dialog role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/dialog_role)
- [A11y Dialog Element Documentation](https://a11y-dialog.netlify.app/further-reading/dialog-element/)

### Responsive iframes
- [Responsive iframes with CSS aspect-ratio](https://gomakethings.com/responsive-iframes-with-the-css-aspect-ratio-property/)
- [Responsive iframes: Native CSS aspect-ratio Guide](https://benmarshall.me/responsive-iframes/)

### Modal Patterns
- [Creating Modal Windows with Pure CSS](https://dev.to/maxprilutskiy/creating-modal-windows-with-pure-css-no-javascript-required-1ja)
- [Modal dialogs without React (or JavaScript)](https://laktek.com/modal-dialogs-without-react-javascript)
- [How to Style HTML Dialog Element](https://www.testmu.ai/blog/html-dialog-element/)

### Data Attributes
- [MDN: Using data attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/Use_data_attributes)
- [CSS-Tricks: A Complete Guide to Data Attributes](https://css-tricks.com/a-complete-guide-to-data-attributes/)
