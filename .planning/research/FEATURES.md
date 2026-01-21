# Feature Landscape: Fold Indicators & Interactive Previews

**Domain:** Responsive testing tools / Visual screenshot reporting
**Researched:** 2026-01-21
**Confidence:** MEDIUM (verified with multiple sources, patterns from existing tools)

## Context

Screenie already has:
- 57 device presets with full-page screenshots
- HTML report with base64-embedded images
- CSS-only click-to-enlarge lightbox (`:target` pseudo-class)
- Category grouping (phones/tablets/desktops)
- Metadata display

This research focuses on v2.1 features:
1. **Fold line indicator** - Visual overlay showing viewport height boundary
2. **Interactive preview modal** - Click to interact with page in iframe at device dimensions

## Table Stakes

Features users expect from fold indicators and interactive previews. Missing these = incomplete feature.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Fold Line Visualization** | | | |
| Horizontal line at viewport height | Standard pattern for "above the fold" indication | Low | CSS overlay, positioned at device.height px |
| Visible but non-intrusive styling | Must be clear without dominating screenshot | Low | Common: dashed/dotted line, semi-transparent |
| Device-specific positioning | Each device has different viewport height | Low | Already have device.height in metadata |
| Label or indicator explaining what line represents | Users unfamiliar with "fold" concept need context | Low | Tooltip or inline label like "Viewport fold (375px)" |
| **Interactive Preview Modal** | | | |
| Click screenshot to open interactive view | Standard pattern in BrowserStack, Responsively App | Medium | Replace/augment existing lightbox |
| Iframe loads target URL at device dimensions | Core value proposition - test interactions | Medium | iframe with width/height from device preset |
| Device frame/bezel (optional) | Professional polish, seen in frameme, WithFrame, Shareshot | Low-Med | CSS border/box-shadow OR actual device PNG frame |
| Close button (X or ESC key) | Expected modal UX | Low | Already have in existing lightbox |
| Device metadata display | Show which device/dimensions being previewed | Low | Already have in existing lightbox |
| **Performance & UX** | | | |
| Fast modal open (no loading delay) | Smooth UX, iframe loads async | Low | iframe lazy loading, modal appears immediately |
| Scrollable iframe content | Full-page screenshots need scrolling in fixed viewport | Low | iframe CSS: overflow scrolling |
| Responsive modal sizing | Modal must work on different screen sizes | Medium | Max-width/height constraints, mobile-friendly |
| Visual indication that preview is interactive | Users need to know they can click/scroll in iframe | Low | Cursor change, hover state, or inline hint |

## Differentiators

Features that set Screenie apart. Not expected, but add significant value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Advanced Fold Visualization** | | | |
| Toggle fold lines on/off | Clean view vs analytical view | Low | Checkbox/button to hide/show all fold overlays |
| Multiple fold lines (mobile vs desktop heights) | Show common viewport breakpoints | Medium | e.g., 667px (iPhone 8), 1080px (Full HD) |
| Fold line with "above/below" shading | Visual emphasis of critical viewport area | Low | Semi-transparent overlay above line |
| Animated scroll preview | Auto-scroll showing content above/below fold | High | Low priority, complex to implement smoothly |
| **Enhanced Interactive Preview** | | | |
| Side-by-side comparison mode | Open multiple device previews simultaneously | Medium | Seen in Responsively App's "mirrored interactions" |
| Synced interactions across devices | Click/scroll in one iframe mirrors to others | High | Complex but powerful for comparison |
| Real device user agent | Iframe uses device-specific UA string | Low | More accurate for responsive behavior testing |
| Touch event simulation | Mobile device preview handles touch gestures | Medium | May need library like Hammer.js |
| Network throttling toggle | Test slow connections in preview | High | Complex, requires service worker or external tool |
| Responsive inspector overlay | Show element dimensions/breakpoints in preview | High | Similar to browser DevTools, significant scope |
| **Workflow Enhancements** | | | |
| Keyboard shortcuts | Arrow keys to navigate between devices | Medium | Good UX, requires keyboard event handling |
| Direct URL sharing to specific device | Share link that opens specific device preview | Low | URL hash like `#preview-iphone-16-pro` |
| Screenshot from within preview | Capture updated state after interaction | Medium | Useful for documenting bugs found |
| Compare mode | Show fold indicator on original vs live preview | Low-Med | Split screen or toggle view |
| **Polish & Professional Use** | | | |
| Device bezels/frames library | Realistic device mockups for presentations | Medium | Maintain PNG assets, handle scaling |
| Export preview as standalone HTML | Share interactive preview without Screenie | Medium | Template iframe as self-contained file |
| Annotation layer | Draw/comment on fold indicators or previews | High | Complex feature, consider deferring |

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Server-side iframe rendering | Complexity, security risks, costs | Client-side iframe loading, user's browser does work |
| Cross-origin iframe bypassing | Security violation, breaks web standards | Accept CORS limitations, document clearly |
| Full browser engine embedding | Massive bundle size, maintenance burden | Use standard iframe, leverage browser's engine |
| Real-time collaborative annotation | Scope creep, requires backend infrastructure | Keep tool local/static, no backend |
| Visual regression diff overlays | Different product category (Percy/Applitools) | Focus on manual review workflow, not automated diffing |
| Multi-browser support (Firefox/Safari) | Playwright already captures in Chromium, adding browsers multiplies cost | Document Chromium-only, sufficient for layout verification |
| Video recording of interactions | File size explosion, complex processing | Static screenshots + interactive preview is enough |
| Built-in network throttling | Complex to implement reliably, DevTools has this | Users can throttle in browser DevTools if needed |
| Touch gesture recording/playback | Complex state management, niche use case | Interactive preview allows manual interaction |
| Authentication/login flow automation | Outside scope, users can provide authenticated URLs | Document "capture after login" workflow |

## Feature Dependencies

```
Fold Line Indicator (Independent)
  ↓
  Toggle fold lines on/off (Enhancement)
  ↓
  Multiple fold lines (Enhancement)

Interactive Preview Modal (Core)
  ↓
  Device frame/bezel (Polish)
  ↓
  Side-by-side comparison (Advanced)
  ↓
  Synced interactions (Complex)

Existing Lightbox (v2.0)
  ↓
  Replace with Tabbed View (New Modal)
    - Tab 1: Static screenshot (existing)
    - Tab 2: Interactive preview (new)
```

## MVP Recommendation (v2.1)

For v2.1 milestone, prioritize these table stakes features:

### Phase 1: Fold Line Indicator
1. Horizontal line overlay at viewport height
2. Non-intrusive dashed styling (e.g., 2px dashed red with 50% opacity)
3. Device-specific positioning using existing device.height
4. Simple label or data attribute with viewport height

**Implementation notes:**
- Add CSS class `.fold-indicator` to each thumbnail/lightbox image
- Position using `::after` pseudo-element or overlay div
- No JavaScript required, pure CSS solution

### Phase 2: Interactive Preview Modal
1. Click thumbnail opens modal with two views: static screenshot + interactive iframe
2. Iframe loads target URL with device width/height constraints
3. Device metadata display (name, dimensions)
4. Close button + ESC key handler
5. Responsive modal sizing

**Implementation notes:**
- Enhance existing lightbox with tabbed interface or side-by-side layout
- iframe sandbox attributes for security
- CSS: `iframe { width: [device.width]px; height: [device.height]px; }`
- Handle CORS limitations gracefully (show error message)

### Phase 3: Polish (Optional for v2.1)
1. Toggle fold lines on/off (checkbox in report header)
2. Keyboard shortcuts (arrow keys to navigate devices)
3. Loading state for iframe (spinner while page loads)

**Defer to v2.2+:**
- Device bezels/frames (requires asset library)
- Side-by-side comparison mode (complex state management)
- Synced interactions (very complex, niche use case)
- Touch event simulation (mobile-specific, lower priority)

## User Expectations

Based on research into similar tools (BrowserStack, Responsively App, Chrome DevTools):

### Fold Indicator Expectations
- **Visual clarity:** Line should be immediately obvious but not distracting
- **Accuracy:** Line positioned exactly at viewport.height (not approximate)
- **Context:** Label or tooltip explaining what line represents
- **Consistency:** Same styling across all device categories

Common viewport heights users expect to see marked:
- **Phones:** 667px (iPhone 8), 740px (iPhone 12), 844px (iPhone 14 Pro)
- **Tablets:** 1024px (iPad), 1366px (iPad Pro)
- **Desktops:** 1080px (Full HD), 1440px (QHD), 2160px (4K)

### Interactive Preview Expectations
- **Immediate response:** Modal opens without delay
- **Functional interactions:** Links, buttons, forms work in iframe
- **Scroll behavior:** Viewport-constrained scrolling (not full-page scroll)
- **Close mechanisms:** Both X button and ESC key work
- **Error handling:** Clear message if iframe fails (CORS, CSP, network)
- **Visual context:** Device dimensions displayed prominently

Users from BrowserStack/Chrome DevTools will expect:
- Ability to test responsive behavior at exact device dimensions
- Real page interaction (not just static screenshot)
- Quick switching between devices

## Research Limitations & Gaps

**LOW confidence areas:**
- Device bezel/frame asset availability - didn't verify free/open-source libraries
- Touch event simulation libraries - mentioned but not deeply evaluated
- Iframe sandbox security best practices for this use case

**Unresolved questions:**
- Should fold indicator appear on thumbnails, lightbox, or both?
- Should interactive preview replace lightbox or augment it (tabs)?
- How to handle pages that prevent iframe embedding (X-Frame-Options)?
- Should fold line be customizable (color, style, position)?

**Recommended follow-up research:**
- Survey 5-10 users on fold indicator visibility preferences
- Test iframe CORS behavior with common web frameworks (Next.js, WordPress)
- Evaluate device frame libraries (frameme, device_frame Flutter) for web port

## Implementation Complexity Assessment

| Feature | Effort | Risk | Notes |
|---------|--------|------|-------|
| Fold line CSS overlay | 1-2 hours | Low | Pure CSS, already have device.height |
| Toggle fold lines | 1 hour | Low | Simple JavaScript toggle class |
| Interactive iframe modal | 4-6 hours | Medium | Security considerations, CORS handling |
| Device frame/bezel | 8-12 hours | Medium | Asset sourcing, scaling logic, performance |
| Side-by-side comparison | 12-16 hours | High | Complex state management, layout challenges |
| Synced interactions | 20-30 hours | High | Event proxying, performance bottlenecks |

**v2.1 MVP recommendation: Fold line (Phase 1) + Interactive preview (Phase 2) = 5-8 hours**

## Sources

This research synthesized findings from multiple sources across responsive testing tools, viewport indicators, and interactive preview patterns:

**Responsive Testing Tools & Patterns:**
- [Above the Fold vs Below the Fold - AB Tasty](https://www.abtasty.com/blog/above-the-fold/)
- [Chrome DevTools Device Mode](https://developer.chrome.com/docs/devtools/device-mode)
- [BrowserStack Responsive Testing Guide](https://www.browserstack.com/guide/view-mobile-version-of-website-on-chrome)
- [Responsively App Features](https://responsively.app/)
- [Viewport Size Tester](https://dcpweb.co.uk/web-tools/viewport-size-tester)

**Visual Testing & Screenshot Tools:**
- [BrowserStack Visual Testing Tools](https://www.browserstack.com/guide/visual-testing-tools)
- [Screenshot Testing Guide](https://www.browserstack.com/guide/screenshot-testing)
- [xScope Overlay Tools](https://xscopeapp.com/guide)
- [Visual Testing in Cypress](https://docs.cypress.io/app/tooling/visual-testing)

**Device Frames & UI Patterns:**
- [frameme - Frame screenshots for any device](https://github.com/joshluongo/frameme)
- [Chrome Toggle Device Bezel](https://ahmedrajawrites.medium.com/chrome-toggle-device-bezel-frames-c85df101e29b)
- [Modal UI Patterns](https://ui-patterns.com/patterns/modal-windows/examples)

**Interactive Preview & Viewport Testing:**
- [Mobile Simulator Testing Tool](https://mavtools.com/tools/mobile-simulator-testing-tool-browser/)
- [Viewport Resizer](https://lab.maltewassermann.com/viewport-resizer/)
- [Puppeteer iframe Guide](https://www.webshare.io/academy-article/puppeteer-iframe)

**Viewport Height Indicators:**
- [CSS Viewport Units Guide](https://elementor.com/blog/vh/)
- [Understanding Mobile Viewport Units](https://medium.com/@tharunbalaji110/understanding-mobile-viewport-units-a-complete-guide-to-svh-lvh-and-dvh-0c905d96e21a)
- [Viewport Height Test](https://gist.github.com/LukeChannings/efdd456bccc3ee1459eacc663e9abc24)

All sources accessed 2026-01-21. Cross-referenced patterns from established tools (BrowserStack, Chrome DevTools, Responsively App) to identify table stakes vs differentiators.
