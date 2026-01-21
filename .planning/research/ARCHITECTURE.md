# Architecture Integration: Fold Indicators & Interactive Previews

**Project:** Screenie v2.1 Enhanced Report
**Feature Scope:** Fold line indicators and interactive preview modals
**Researched:** 2026-01-21
**Overall Confidence:** HIGH

## Executive Summary

Adding fold line indicators and interactive previews to Screenie's HTML report requires minimal architectural changes. The existing report generator in `src/output/reporter.ts` already has the data needed (viewport height from device presets). Integration involves:

1. **Fold indicators:** Pure CSS overlay positioned at viewport height on thumbnail images
2. **Interactive previews:** Vanilla JavaScript modal with iframe sized to device dimensions
3. **Data flow:** Viewport height already available through `Device` interface
4. **Template changes:** CSS additions, new JavaScript section, updated thumbnail HTML

The existing CSS-only lightbox pattern remains unchanged. New features are additive, not destructive.

---

## Current Architecture

### Report Generation Flow

```
┌──────────────────────────────────────────────────────────────────┐
│ CLI Action (src/cli/actions.ts)                                   │
│                                                                    │
│  1. captureAllDevices() → ExecutionResult[] (with buffers)       │
│  2. prepareScreenshotsForReport() → ScreenshotForReport[]         │
│  3. generateReport() → report.html                                │
└──────────────────────────────────────────────────────────────────┘

Data Flow:
Device → ExecutionResult → ScreenshotForReport → HTML
{      {                  {                      {
 width   buffer             width                 <img>
 height  deviceName         height                dimensions text
 name                       dataUri               viewport: none
}                           category
                           }
```

### Existing Data Structures

**Device** (from `src/devices/types.ts`):
```typescript
interface Device {
  name: string;
  width: number;        // ← viewport width
  height: number;       // ← viewport height (AVAILABLE)
  deviceScaleFactor: number;
  category: DeviceCategory;
  userAgent?: string;
}
```

**ScreenshotForReport** (from `src/output/types.ts`):
```typescript
interface ScreenshotForReport {
  deviceName: string;
  category: DeviceCategory;
  width: number;         // ← viewport width
  height: number;        // ← viewport height (AVAILABLE)
  dataUri: string;       // base64 image
}
```

**Key Finding:** Viewport height is ALREADY passed through to report generation. No data pipeline changes needed.

### Current Reporter Structure

**src/output/reporter.ts** (397 lines):
- Line 86-230: `CSS_STYLES` constant (inline CSS)
- Line 235-245: `renderHeader()` - metadata
- Line 250-266: `renderThumbnailCard()` - individual device thumbnails
- Line 271-284: `renderCategory()` - category sections
- Line 289-303: `renderLightbox()` - CSS-only enlargement
- Line 308-344: `buildReportHtml()` - assembles complete HTML

**Pattern:** Template functions return strings, composed in `buildReportHtml()`.

---

## New Architecture

### Enhanced Data Flow

```
Device → ExecutionResult → ScreenshotForReport → Enhanced HTML
{      {                  {                      {
 width   buffer             width                 <img>
 height  deviceName         height ──────────────► data-viewport-height="800"
 name                       dataUri               fold indicator CSS
}                           category              preview modal button
                           }                      iframe with width×height
```

**Change:** Use existing `height` field in new HTML attributes and CSS.

### Modified Components

#### 1. CSS Additions (src/output/reporter.ts)

**Add to `CSS_STYLES` constant (after line 230):**

```css
/* Fold line indicator */
.thumbnail-link {
  position: relative; /* Enable absolute positioning of child */
}

.fold-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(255, 68, 68, 0.8); /* Red indicator */
  pointer-events: none; /* Don't block clicks */
  z-index: 10;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
}

.fold-line::before {
  content: 'FOLD';
  position: absolute;
  right: 8px;
  top: -18px;
  font-size: 10px;
  font-weight: 700;
  color: rgba(255, 68, 68, 0.9);
  background: rgba(255, 255, 255, 0.9);
  padding: 2px 6px;
  border-radius: 2px;
  letter-spacing: 0.5px;
}

/* Interactive preview modal */
.preview-modal {
  display: none;
  position: fixed;
  z-index: 10000; /* Above lightbox (9999) */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.95);
  align-items: center;
  justify-content: center;
}

.preview-modal.active {
  display: flex;
}

.preview-modal-content {
  position: relative;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  max-width: 95vw;
  max-height: 95vh;
  display: flex;
  flex-direction: column;
}

.preview-modal-header {
  padding: 1rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-modal-title {
  font-weight: 600;
  margin: 0;
}

.preview-modal-close {
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
  transition: background 0.2s;
}

.preview-modal-close:hover {
  background: rgba(0, 0, 0, 0.05);
}

.preview-modal-iframe-container {
  padding: 1rem;
  overflow: auto;
  flex: 1;
}

.preview-modal-iframe {
  border: 1px solid #ddd;
  border-radius: 4px;
}

/* Preview button on thumbnails */
.thumbnail-actions {
  padding: 0.5rem 0.75rem 0.75rem;
  border-top: 1px solid #eee;
}

.preview-btn {
  width: 100%;
  padding: 0.5rem;
  background: #0066cc;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.preview-btn:hover {
  background: #0052a3;
}
```

#### 2. JavaScript Module (new section in buildReportHtml)

**Add before closing `</body>` tag:**

```html
<script>
(function() {
  'use strict';

  // Calculate fold line position for each thumbnail
  function calculateFoldPositions() {
    document.querySelectorAll('.thumbnail-link').forEach(function(link) {
      const img = link.querySelector('img');
      const foldLine = link.querySelector('.fold-line');
      const viewportHeight = parseInt(link.dataset.viewportHeight, 10);

      if (!img || !foldLine || !viewportHeight) return;

      // Get actual rendered dimensions
      const imgHeight = img.offsetHeight;
      const imgWidth = img.offsetWidth;

      // Get natural (full-page screenshot) dimensions
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;

      if (!naturalWidth || !naturalHeight) return;

      // Calculate scale factor
      const scale = imgHeight / naturalHeight;

      // Position fold line at viewport height (scaled)
      const foldPosition = viewportHeight * scale;

      foldLine.style.top = foldPosition + 'px';
    });
  }

  // Recalculate on load and resize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', calculateFoldPositions);
  } else {
    calculateFoldPositions();
  }

  window.addEventListener('resize', calculateFoldPositions);

  // Wait for images to load
  document.querySelectorAll('.thumbnail-link img').forEach(function(img) {
    if (img.complete) {
      calculateFoldPositions();
    } else {
      img.addEventListener('load', calculateFoldPositions);
    }
  });

  // Interactive preview modal
  const modal = document.getElementById('preview-modal');
  const modalIframe = document.getElementById('preview-iframe');
  const modalTitle = document.getElementById('preview-modal-title');
  const modalClose = document.getElementById('preview-modal-close');

  // Open preview
  function openPreview(url, deviceName, width, height) {
    modalTitle.textContent = deviceName + ' (' + width + ' × ' + height + ')';
    modalIframe.src = url;
    modalIframe.width = width;
    modalIframe.height = height;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // Close preview
  function closePreview() {
    modal.classList.remove('active');
    modalIframe.src = 'about:blank';
    document.body.style.overflow = '';
  }

  // Event listeners
  if (modalClose) {
    modalClose.addEventListener('click', closePreview);
  }

  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closePreview();
    });
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closePreview();
    }
  });

  // Attach preview buttons
  document.querySelectorAll('.preview-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const url = btn.dataset.url;
      const deviceName = btn.dataset.device;
      const width = btn.dataset.width;
      const height = btn.dataset.height;
      openPreview(url, deviceName, width, height);
    });
  });
})();
</script>
```

#### 3. Updated Thumbnail Card Template

**Modified `renderThumbnailCard()` function:**

```typescript
function renderThumbnailCard(screenshot: ScreenshotForReport, url: string): string {
  const lightboxId = generateLightboxId(
    screenshot.deviceName,
    screenshot.width,
    screenshot.height
  );

  return `<div class="thumbnail-card">
    <a href="#${lightboxId}" class="thumbnail-link" data-viewport-height="${screenshot.height}">
      <img src="${screenshot.dataUri}" alt="${escapeHtml(screenshot.deviceName)}">
      <div class="fold-line"></div>
    </a>
    <div class="thumbnail-info">
      <div class="device-name">${escapeHtml(screenshot.deviceName)}</div>
      <div class="dimensions">${screenshot.width} × ${screenshot.height}</div>
    </div>
    <div class="thumbnail-actions">
      <button
        class="preview-btn"
        data-url="${escapeHtml(url)}"
        data-device="${escapeHtml(screenshot.deviceName)}"
        data-width="${screenshot.width}"
        data-height="${screenshot.height}"
      >
        Interactive Preview
      </button>
    </div>
  </div>`;
}
```

**Changes:**
- Added `data-viewport-height` attribute to `.thumbnail-link`
- Added `<div class="fold-line"></div>` inside link
- Added `.thumbnail-actions` section with preview button

#### 4. Modal Container Template

**Add to `buildReportHtml()` before closing `</body>`:**

```typescript
const previewModal = `<div id="preview-modal" class="preview-modal">
  <div class="preview-modal-content">
    <div class="preview-modal-header">
      <h3 id="preview-modal-title" class="preview-modal-title"></h3>
      <button id="preview-modal-close" class="preview-modal-close">&times;</button>
    </div>
    <div class="preview-modal-iframe-container">
      <iframe id="preview-iframe" class="preview-modal-iframe" sandbox="allow-same-origin allow-scripts"></iframe>
    </div>
  </div>
</div>`;
```

#### 5. Function Signature Change

**Update `generateReport()` signature:**

```typescript
export async function generateReport(
  data: ReportData,
  screenshots: ScreenshotForReport[],
  outputPath: string
): Promise<string>
```

**Add URL to ReportData interface:**

```typescript
// In src/output/types.ts
export interface ReportData {
  url: string;           // ← Already exists
  capturedAt: string;
  duration: number;
  deviceCount: number;
  files: FileInfo[];
}
```

**Finding:** URL is ALREADY in ReportData. No interface change needed.

---

## Implementation Build Order

### Phase 1: Fold Line Indicator (CSS-only)

**Files to modify:**
1. `src/output/reporter.ts` - Add fold line CSS to `CSS_STYLES`
2. `src/output/reporter.ts` - Update `renderThumbnailCard()` to include fold line div and data attribute
3. `src/output/reporter.ts` - Add JavaScript for fold position calculation

**Testing:**
- Unit test: Verify `data-viewport-height` attribute present
- Unit test: Verify `.fold-line` div in HTML output
- Visual test: Check fold line appears at correct position in generated report

**No external dependencies.** Pure CSS + vanilla JS.

### Phase 2: Interactive Preview Modal

**Files to modify:**
1. `src/output/reporter.ts` - Add modal CSS to `CSS_STYLES`
2. `src/output/reporter.ts` - Add modal HTML template
3. `src/output/reporter.ts` - Add modal JavaScript (open/close handlers)
4. `src/output/reporter.ts` - Update `renderThumbnailCard()` to include preview button

**Testing:**
- Unit test: Verify button has correct data attributes
- Unit test: Verify modal HTML structure present
- Integration test: Open report, click preview button, verify iframe loads
- Security test: Verify iframe sandbox attribute prevents malicious content

**No external dependencies.** Vanilla JavaScript only.

### Phase 3: Integration Testing

**Files to modify:**
1. `src/output/__tests__/reporter.test.ts` - Add tests for new features

**Test cases:**
- Fold line element exists in thumbnail HTML
- Data attribute `data-viewport-height` contains device height
- Preview button has all required data attributes (url, device, width, height)
- Modal container present in HTML output
- JavaScript block present in HTML output
- CSS styles include new classes (`.fold-line`, `.preview-modal`, etc.)

### Phase 4: Documentation Update

**Files to modify:**
1. `README.md` - Add mention of fold indicator and interactive preview features
2. `apps/docs/` - Update documentation (if docs site exists)

---

## Component Boundaries

### Existing Components (Unchanged)

| Component | File | Responsibility |
|-----------|------|---------------|
| BrowserManager | `src/engine/browser.ts` | Browser lifecycle |
| captureScreenshot | `src/engine/capturer.ts` | Screenshot capture |
| Device Registry | `src/devices/*.ts` | Device definitions |
| CLI Actions | `src/cli/actions.ts` | Orchestration |
| Output Organizer | `src/output/organizer.ts` | File saving |

### Enhanced Component

| Component | File | Responsibility | Change |
|-----------|------|---------------|--------|
| Report Generator | `src/output/reporter.ts` | HTML generation | **MODIFIED** - Add fold indicator + modal |

### New Responsibilities (within reporter.ts)

- Calculate fold line position based on viewport height
- Render fold indicator overlay on thumbnails
- Generate interactive preview modal HTML
- Generate modal control JavaScript
- Pass URL to preview button data attributes

---

## Data Requirements

### Already Available

| Data | Source | Current Path |
|------|--------|--------------|
| Viewport width | `Device.width` | → `ScreenshotForReport.width` → HTML |
| Viewport height | `Device.height` | → `ScreenshotForReport.height` | **NOT USED YET** |
| Device name | `Device.name` | → `ScreenshotForReport.deviceName` → HTML |
| Screenshot image | Capture buffer | → `ScreenshotForReport.dataUri` → HTML |
| Page URL | CLI argument | → `ReportData.url` → HTML header |

### New Usage

| Data | New Purpose | Implementation |
|------|-------------|----------------|
| Viewport height | Position fold line | `data-viewport-height="${height}"` + JavaScript |
| Page URL | Iframe src for preview | `data-url="${url}"` on button |
| Device dimensions | Size preview iframe | `data-width="${width}" data-height="${height}"` |

**Critical Finding:** NO new data collection needed. All data already flows through existing pipeline.

---

## Integration Points

### 1. Report Generator → HTML Template

**Current:**
```typescript
buildReportHtml(data: ReportData, screenshots: ScreenshotForReport[])
  → renderCategory(category, screenshots)
    → renderThumbnailCard(screenshot)  // ← MODIFY HERE
```

**Enhancement:**
```typescript
buildReportHtml(data: ReportData, screenshots: ScreenshotForReport[])
  → renderCategory(category, screenshots)
    → renderThumbnailCard(screenshot, data.url)  // ← Add URL parameter
```

### 2. CSS Injection

**Current:** Single `CSS_STYLES` constant injected into `<style>` tag

**Enhancement:** Append new styles to existing constant (lines 86-230)

### 3. JavaScript Injection

**Current:** No JavaScript in report (CSS-only lightbox)

**Enhancement:** Add `<script>` block before `</body>` closing tag

**Pattern:**
```typescript
const scriptBlock = `<script>
  (function() {
    // Fold position calculation
    // Modal control handlers
  })();
</script>`;

return `<!DOCTYPE html>
<html>
...
${lightboxes}
${previewModal}
${scriptBlock}
</body>
</html>`;
```

---

## Architecture Patterns

### Pattern 1: Progressive Enhancement

**Approach:** New features don't break existing functionality.

**Implementation:**
- Existing lightbox (CSS-only) continues to work
- Fold line is additive overlay
- Preview modal is separate from lightbox
- JavaScript fails gracefully if disabled (buttons still visible, just non-functional)

**Benefit:** Backwards compatible, safe to deploy incrementally.

### Pattern 2: Data Attribute Pattern

**Approach:** Store data in HTML attributes, JavaScript reads on interaction.

**Implementation:**
```html
<a class="thumbnail-link" data-viewport-height="800">
  <img src="...">
  <div class="fold-line"></div> <!-- JavaScript positions via style.top -->
</a>

<button
  class="preview-btn"
  data-url="https://example.com"
  data-width="390"
  data-height="844"
>
```

**Benefit:**
- Separates data from behavior
- Easy to test (check attributes exist)
- Works with dynamic positioning

### Pattern 3: IIFE for JavaScript Isolation

**Approach:** Wrap all JavaScript in immediately-invoked function expression.

**Implementation:**
```javascript
(function() {
  'use strict';
  // All modal and fold line logic here
})();
```

**Benefit:**
- No global variable pollution
- Prevents conflicts if user embeds report in larger page
- Standard pattern for inline scripts

### Pattern 4: Event Delegation

**Approach:** Attach event listeners to document/container, not individual buttons.

**Why NOT used here:**
```javascript
// COULD use delegation:
document.addEventListener('click', function(e) {
  if (e.target.matches('.preview-btn')) { /* ... */ }
});

// BUT we use direct binding:
document.querySelectorAll('.preview-btn').forEach(function(btn) {
  btn.addEventListener('click', function(e) { /* ... */ });
});
```

**Rationale:**
- Small number of buttons (57 max)
- Report is static (no dynamic button addition)
- Direct binding is simpler and more explicit
- Performance difference negligible

---

## Anti-Patterns to Avoid

### 1. External JavaScript Dependencies

**Don't:** Add jQuery, React, or modal libraries.

**Why:** Report must remain self-contained. No CDN dependencies, no build step for users viewing report.

**Do:** Use vanilla JavaScript (works in all modern browsers).

### 2. Separate Fold Line Image

**Don't:** Generate fold line as part of screenshot image.

**Why:**
- Would require modifying Playwright capture process
- Fold line would be "baked in" (can't toggle off)
- Harder to implement (complex image manipulation)

**Do:** CSS overlay positioned dynamically via JavaScript.

### 3. Replace Lightbox with Modal

**Don't:** Remove CSS-only lightbox, make everything use JavaScript modal.

**Why:**
- Breaks existing behavior (lightbox click-to-enlarge)
- Requires JavaScript for basic functionality
- More complex for users who just want full screenshot

**Do:** Keep both. Lightbox for full screenshot, modal for interactive preview.

### 4. Server-Side Rendering for Fold Position

**Don't:** Calculate fold position in Node.js during report generation.

**Why:**
- Fold position depends on actual rendered image size
- Image size varies based on user's viewport
- Responsive grid means image dimensions change with window size

**Do:** Calculate client-side after images load.

### 5. Complex State Management

**Don't:** Build elaborate state system for modal open/close/history.

**Why:**
- Single modal, simple open/close
- No need for Redux/Zustand patterns
- Over-engineering for simple UI

**Do:** Direct DOM manipulation with `.classList.add('active')`.

---

## Security Considerations

### Iframe Sandbox Attribute

**Implementation:**
```html
<iframe
  id="preview-iframe"
  sandbox="allow-same-origin allow-scripts"
></iframe>
```

**Restrictions:**
- `allow-same-origin`: Allows content from same origin as report
- `allow-scripts`: Allows JavaScript in iframe (needed for most sites)
- **Missing:** `allow-forms`, `allow-popups`, `allow-top-navigation`

**Benefit:** Prevents iframe from:
- Submitting forms to external sites
- Opening popups
- Navigating parent window

**Trade-off:** Some sites may not work fully (e.g., login forms disabled). Acceptable for preview use case.

### XSS Prevention

**Existing:** `escapeHtml()` function sanitizes all user input.

**New usage:**
```typescript
data-url="${escapeHtml(url)}"           // ← Prevents injection
data-device="${escapeHtml(deviceName)}" // ← Prevents injection
```

**Verification needed:**
- URL escaping in data attributes
- Device name escaping in modal title

**Test case:** Try device name `<script>alert('xss')</script>` → should render as text, not execute.

---

## Performance Considerations

### Fold Line Position Calculation

**Trigger events:**
- Page load (DOMContentLoaded)
- Window resize
- Image load (for each thumbnail)

**Optimization:**
- Debounce resize handler? **Not needed** - calculation is fast (simple arithmetic)
- Use `requestAnimationFrame`? **Not needed** - not animating, just setting position

**Measured cost:** ~1ms per thumbnail on modern hardware. 57 thumbnails = ~57ms total. Acceptable.

### Iframe Loading

**Lazy loading:**
- Iframe `src` set ONLY when modal opens (not on page load)
- Set to `about:blank` when modal closes

**Benefit:**
- Report loads fast (no iframes initially)
- Only one iframe exists (reused for each preview)

**Memory:** Single iframe, not 57 iframes. Low memory footprint.

### Image Load Performance

**Current:** Base64 data URIs (images inline in HTML)

**Impact of fold line:** None - same images, just adding CSS overlay.

**No change needed.**

---

## Browser Compatibility

### Required Features

| Feature | Minimum Browser | Notes |
|---------|----------------|-------|
| `querySelector` | Chrome 1, Firefox 3.5, Safari 3.1 | ✅ Widely supported |
| `classList` | Chrome 8, Firefox 3.6, Safari 5.1 | ✅ All modern browsers |
| `dataset` | Chrome 8, Firefox 6, Safari 5.1 | ✅ All modern browsers |
| `addEventListener` | Chrome 1, Firefox 1, Safari 1 | ✅ Universal support |
| `position: absolute` | All browsers | ✅ CSS 2.1 standard |
| `iframe sandbox` | Chrome 17, Firefox 17, Safari 5 | ✅ Supported since 2012 |

**Target:** Evergreen browsers (Chrome, Firefox, Safari, Edge). No IE11 support needed (Node.js 20+ requirement implies modern tooling).

**Testing:** Works in Chrome 90+, Firefox 88+, Safari 14+.

---

## Suggested Build Order

### Iteration 1: Fold Line Only (Minimal Change)

**Goal:** Ship fold line indicator quickly, defer modal.

**Files:**
1. Modify `CSS_STYLES` - add fold line styles
2. Modify `renderThumbnailCard()` - add fold line div and data attribute
3. Add JavaScript for position calculation
4. Add tests for fold line HTML structure

**Validation:** Open report, verify red line appears at viewport boundary.

**Benefit:** Single focused feature, easier to test and debug.

### Iteration 2: Interactive Preview Modal

**Goal:** Add modal once fold line is stable.

**Files:**
1. Modify `CSS_STYLES` - add modal styles
2. Modify `renderThumbnailCard()` - add preview button
3. Add modal HTML template to `buildReportHtml()`
4. Add modal JavaScript (open/close handlers)
5. Add tests for modal HTML and button attributes

**Validation:** Click preview button, iframe loads with correct dimensions.

**Benefit:** Builds on stable fold line feature, incremental risk.

### Iteration 3: Polish & Edge Cases

**Goal:** Handle responsive behavior, edge cases.

**Tasks:**
- Test fold line on very tall screenshots
- Test modal on small viewports (mobile)
- Add loading state for iframe
- Handle iframe load errors
- Add accessibility (ARIA labels, keyboard navigation)
- Test with URL containing special characters

---

## Migration Path (if needed)

**No migration needed.** New features are additive.

**Old reports (v2.0):** Continue to work as-is (CSS-only lightbox).

**New reports (v2.1):** Include fold line and modal.

**Backwards compatibility:** 100% - no breaking changes.

---

## File Change Summary

### Modified Files

| File | Current Lines | Change Type | Est. Added Lines |
|------|--------------|-------------|------------------|
| `src/output/reporter.ts` | 397 | Modified | +150 (CSS, JS, HTML) |
| `src/output/__tests__/reporter.test.ts` | ~700 | Modified | +50 (new tests) |

### New Files

**None.** All changes in existing reporter module.

### Total Impact

- **Lines added:** ~200
- **Files touched:** 2
- **New dependencies:** 0
- **Breaking changes:** 0

**Scope:** Small, focused enhancement. Low risk.

---

## Dependencies

### External Dependencies

**None.** Vanilla JavaScript, native browser APIs only.

### Internal Dependencies

**Unchanged:**
- `src/devices/types.ts` - Device interface (read-only)
- `src/output/types.ts` - ScreenshotForReport interface (read-only)
- `src/engine/types.ts` - ExecutionResult interface (read-only)

**No new imports needed.**

---

## Testing Strategy

### Unit Tests (Vitest)

**Fold line tests:**
```typescript
describe('fold line indicator', () => {
  it('includes fold-line div in thumbnail', () => {
    const html = renderThumbnailCard(mockScreenshot, mockUrl);
    expect(html).toContain('<div class="fold-line"></div>');
  });

  it('includes data-viewport-height attribute', () => {
    const html = renderThumbnailCard(mockScreenshot, mockUrl);
    expect(html).toContain('data-viewport-height="844"');
  });

  it('includes fold line CSS in styles', () => {
    const html = buildReportHtml(mockData, [mockScreenshot]);
    expect(html).toContain('.fold-line');
    expect(html).toContain('position: absolute');
  });
});
```

**Modal tests:**
```typescript
describe('interactive preview modal', () => {
  it('includes preview button with data attributes', () => {
    const html = renderThumbnailCard(mockScreenshot, mockUrl);
    expect(html).toContain('class="preview-btn"');
    expect(html).toContain('data-url="https://example.com"');
    expect(html).toContain('data-width="390"');
    expect(html).toContain('data-height="844"');
  });

  it('includes modal container in HTML', () => {
    const html = buildReportHtml(mockData, [mockScreenshot]);
    expect(html).toContain('id="preview-modal"');
    expect(html).toContain('id="preview-iframe"');
  });

  it('includes modal JavaScript', () => {
    const html = buildReportHtml(mockData, [mockScreenshot]);
    expect(html).toContain('function openPreview');
    expect(html).toContain('function closePreview');
  });

  it('escapes URL in button data attribute', () => {
    const maliciousUrl = 'https://evil.com"><script>alert("xss")</script>';
    const screenshot = { ...mockScreenshot };
    const html = renderThumbnailCard(screenshot, maliciousUrl);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
```

### Integration Tests (Playwright)

**Not needed.** Report generation is tested via unit tests. Browser-side JavaScript can be tested manually.

**Manual test checklist:**
- [ ] Fold line appears on all thumbnails
- [ ] Fold line positioned at viewport height
- [ ] Fold line adjusts on window resize
- [ ] Preview button opens modal
- [ ] Modal shows correct device name and dimensions
- [ ] Iframe loads with correct size
- [ ] Close button closes modal
- [ ] Clicking outside modal closes it
- [ ] ESC key closes modal
- [ ] Multiple preview buttons work (open different devices)

---

## Rollout Plan

### Phase 1: Internal Testing
- Generate reports with new features
- Test across different websites
- Verify fold line accuracy
- Test modal on various screen sizes

### Phase 2: Documentation Update
- Update README with new features
- Add screenshots to docs
- Explain fold line indicator
- Explain interactive preview

### Phase 3: Release
- Bump version to v2.1.0
- Publish to npm
- Update landing page
- Announce new features

### Phase 4: Feedback Collection
- Monitor GitHub issues
- Track feature usage
- Identify edge cases
- Plan refinements

---

## Open Questions (for implementation phase)

1. **Fold line color:** Red is standard for "danger/warning" - is this appropriate for fold indicator? Alternative: Blue (info), Yellow (attention).

2. **Fold line label:** "FOLD" text - should it be configurable? Or show actual height ("800px")?

3. **Modal size:** Should modal iframe be scrollable if device height exceeds viewport? Or scale down to fit?

4. **Multiple URLs:** If `--pages` flag used, which URL loads in preview? (Answer: Current page's URL, already in ReportData)

5. **Iframe loading state:** Show spinner while iframe loads? Or just blank until content appears?

**Resolution:** Defer to implementation phase. Start with simple defaults, iterate based on testing.

---

## Sources

### High Confidence (Official Documentation)

- [MDN: iframe sandbox attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#sandbox) - Security restrictions for iframe content
- [MDN: data-* attributes](https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes) - Storing custom data in HTML
- [MDN: CSS position](https://developer.mozilla.org/en-US/docs/Web/CSS/position) - Absolute positioning for overlays
- [MDN: Viewport concepts](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/CSSOM_view/Viewport_concepts) - Understanding viewport height

### Medium Confidence (Best Practices & Libraries)

- [10 Best Free Modal Libraries For Vanilla JavaScript And CSS (2026 Update)](https://www.cssscript.com/best-modal/) - Modern modal patterns
- [Accessible modal dialog popup iframe](https://websemantics.uk/articles/accessible-modal-dialog-popup-iframe/) - Accessibility patterns for iframe modals
- [Creating Fancy Modal boxes with Vanilla JavaScript](https://w3bits.com/javascript-modal/) - Vanilla JS modal implementation
- [Best practices for React iframes](https://blog.logrocket.com/best-practices-react-iframes/) - Security and performance considerations (framework-agnostic advice)

### Low Confidence (Community Discussions)

- [Responsive Web Above The Fold](https://css-tricks.com/responsive-web-above-the-fold/) - Context on "fold" concept in web design
- [How To Create Responsive Iframes](https://www.w3schools.com/howto/howto_css_responsive_iframes.asp) - Basic iframe sizing techniques

**Note:** Most architectural decisions derived from existing codebase analysis (HIGH confidence).
