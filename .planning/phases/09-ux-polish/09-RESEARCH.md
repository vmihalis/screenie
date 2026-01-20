# Phase 9: UX Polish - Research Findings

## Overview

This document captures research findings for implementing UX polish features: progress indicators (UX-01), cookie banner auto-hiding (UX-02), and clear error messages (UX-03). The phase builds on existing CLI infrastructure that already has:
- Basic progress output using `stdout.write` with carriage return
- `onProgress` callback in `captureAllDevices`
- Color support via picocolors
- Ora spinner library (already installed as dependency)

---

## 1. Progress Indicators (UX-01)

### 1.1 Recommended Library: Ora (Already Installed)

The project already has `ora@^8.0.0` in dependencies. Ora is ideal for our use case:

| Feature | Ora | cli-progress | nanospinner |
|---------|-----|--------------|-------------|
| Best for | Async operations | Known progress % | Minimal footprint |
| Multiple bars | No | Yes | No |
| Text updates | Yes | Yes | Yes |
| Size | ~280 kB | ~55 kB | ~20 kB |
| Already installed | Yes | No | No |

**Why Ora fits:**
- Screenshot capture doesn't have predictable duration per device
- We need a spinner to show activity, plus count text
- Single spinner with dynamic text is perfect for "12/50 iPhone 14 Pro"

### 1.2 Ora API for Progress Updates

```typescript
import ora from 'ora';

// Create and start spinner
const spinner = ora({
  text: 'Starting capture...',
  spinner: 'dots',  // Default, works well
  color: 'cyan',
}).start();

// Update text during capture (called from onProgress)
spinner.text = `Capturing 12/50: iPhone 14 Pro...`;

// On success
spinner.succeed('Captured 50/50 devices');

// On failure (with partial success)
spinner.stopAndPersist({
  symbol: '!',
  text: 'Captured 45/50 devices (5 failed)',
});

// Properties that can be changed mid-spin:
spinner.text = 'new text';
spinner.color = 'yellow';
spinner.spinner = 'line';

// Check state
if (spinner.isSpinning) { ... }
```

### 1.3 Spinner + Count Pattern

For "Capturing 12/50: iPhone 14 Pro..." pattern:

```typescript
async function captureWithProgress(
  manager: BrowserManager,
  url: string,
  devices: Device[],
  options: ExecutionOptions
): Promise<CaptureAllResult> {
  const spinner = ora({
    text: `Starting capture of ${devices.length} devices...`,
    color: 'cyan',
  }).start();

  const result = await captureAllDevices(manager, url, devices, captureOptions, {
    ...options,
    onProgress: (done, total, res) => {
      const status = res.success ? pc.green('OK') : pc.red('FAIL');
      spinner.text = `Capturing ${done}/${total}: ${res.deviceName} ${status}`;
    },
  });

  // Final state based on results
  if (result.failureCount === 0) {
    spinner.succeed(`Captured ${result.successCount}/${devices.length} devices`);
  } else {
    spinner.stopAndPersist({
      symbol: pc.yellow('!'),
      text: `Captured ${result.successCount}/${devices.length} devices (${result.failureCount} failed)`,
    });
  }

  return result;
}
```

### 1.4 Integration with Existing Code

Current `actions.ts` uses `process.stdout.write`. Migration path:

```typescript
// Current (line 73-77):
onProgress: (done, total, res) => {
  const status = res.success ? pc.green('OK') : pc.red('FAIL');
  process.stdout.write(`\r  ${done}/${total} ${res.deviceName} ${status}  `);
},

// New with spinner (spinner created outside the callback):
onProgress: (done, total, res) => {
  const status = res.success ? pc.green('OK') : pc.red('FAIL');
  spinner.text = `Capturing ${done}/${total}: ${res.deviceName} ${status}`;
},
```

### 1.5 Important Considerations

1. **Single-threaded nature**: Ora works because our async operations yield to the event loop
2. **TTY detection**: Ora automatically disables animation in non-TTY environments (CI, pipes)
3. **Windows support**: Ora uses simpler spinners on Windows command prompt
4. **Clear before output**: Call `spinner.stop()` before any `console.log` to avoid garbled output

---

## 2. Cookie Banner Auto-Hiding (UX-02)

### 2.1 The Problem

Cookie consent banners (GDPR/CCPA compliance) appear on page load and obscure content in screenshots. Solutions range from:
1. CSS injection to hide banners (simplest, visual only)
2. Clicking "accept" buttons (affects cookies/tracking)
3. Using filter lists (complex, external dependencies)

### 2.2 Recommended Approach: CSS Injection

**Why CSS injection:**
- Simple to implement with `page.addStyleTag()`
- No side effects (doesn't accept cookies, just hides visually)
- Works for screenshots (we just need visual hiding)
- Can be applied at page level after navigation

**Trade-off:** Some banners may require accepting for content to be accessible. For our use case (screenshots), visual hiding is sufficient.

### 2.3 Common Cookie Banner Selectors

Compiled from "I Don't Care About Cookies" and Consent-O-Matic rules:

```typescript
/**
 * CSS selectors for common cookie consent banners and overlays.
 * Sources:
 * - "I don't care about cookies" extension
 * - Consent-O-Matic rules
 * - htmlcsstoimage.com blocking guide
 */
export const COOKIE_BANNER_SELECTORS = [
  // === Major CMP Platforms ===
  '#onetrust-consent-sdk',           // OneTrust
  '#onetrust-banner-sdk',            // OneTrust banner
  '#CybotCookiebotDialog',           // Cookiebot
  '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll', // Cookiebot
  '.qc-cmp2-container',              // Quantcast Choice
  '#truste-consent-track',           // TrustArc
  '#truste-consent-button',          // TrustArc
  '#didomi-host',                    // Didomi
  '#didomi-notice',                  // Didomi
  '.osano-cm-window',                // Osano
  '#cmpbox',                         // consentmanager.net
  '#usercentrics-root',              // Usercentrics

  // === Common Generic Patterns ===
  '#cookie-banner',
  '#cookie-notice',
  '#cookie-consent',
  '#cookie-law-info-bar',
  '#cookieNotice',
  '#cookieBanner',
  '.cookie-banner',
  '.cookie-notice',
  '.cookie-consent',
  '.cookie-popup',
  '.cookie-modal',
  '.cookie-overlay',

  // === EU/GDPR Specific ===
  '#eu-cookie-bar',
  '#eucookie',
  '#gdpr-banner',
  '#gdprContainer',
  '.gdpr-banner',
  '.gdpr-popup',

  // === Regional/Framework Specific ===
  '#tarteaucitronRoot',              // Tarteaucitron (French)
  '#cnilCookie',                     // CNIL compliance
  '#cc-notification',                // Cookie Compliance
  '#cc-modal',                       // Cookie Compliance
  '.cc-banner',                      // cookieconsent.js
  '.cc-window',                      // cookieconsent.js
  '.CookieChoiceContainer',          // Google Cookie Choices

  // === Common Class Patterns ===
  '[class*="cookie-consent"]',
  '[class*="cookie-banner"]',
  '[class*="cookie-notice"]',
  '[id*="cookie-consent"]',
  '[id*="cookie-banner"]',
  '[id*="cookie-notice"]',

  // === Overlay/Modal Patterns ===
  '.consent-banner',
  '.consent-overlay',
  '.consent-modal',
  '.privacy-banner',
  '.privacy-notice',
];
```

### 2.4 CSS Injection Implementation

```typescript
import type { Page, BrowserContext } from 'playwright';

/**
 * CSS rule to hide cookie banners.
 * Uses display:none + visibility:hidden for complete hiding.
 */
function buildCookieHideCSS(selectors: string[]): string {
  return `${selectors.join(',\n')} {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
}`;
}

/**
 * Hide cookie banners on a page via CSS injection.
 * Should be called after page.goto() completes.
 */
export async function hideCookieBanners(page: Page): Promise<void> {
  const css = buildCookieHideCSS(COOKIE_BANNER_SELECTORS);
  await page.addStyleTag({ content: css });
}

// Usage in capturer.ts:
await page.goto(url, { waitUntil: 'networkidle', timeout });
await hideCookieBanners(page);  // Inject CSS after page loads
const screenshot = await page.screenshot({ fullPage: true });
```

### 2.5 Context-Level vs Page-Level Injection

**Option A: Per-Page (Recommended)**
```typescript
// In captureScreenshot function
await page.goto(url, ...);
await page.addStyleTag({ content: cookieHideCSS });
```

**Option B: Context-Level Script**
```typescript
// Inject CSS on every page created in context
const context = await browser.newContext();
await context.addInitScript(() => {
  const style = document.createElement('style');
  style.textContent = `/* cookie hiding CSS */`;
  document.head.appendChild(style);
});
```

Per-page is recommended because:
- More predictable timing (after network idle)
- Doesn't require changing context creation
- Easier to make optional via config

### 2.6 Configuration Option

Make cookie hiding configurable:

```typescript
interface CaptureOptions {
  // ... existing options
  /** Hide common cookie consent banners (default: true) */
  hideCookieBanners?: boolean;
}
```

---

## 3. Error Messages (UX-03)

### 3.1 Error Categories

Based on existing `NON_RETRYABLE_PATTERNS` and Playwright error research:

| Category | Error Patterns | User-Friendly Message |
|----------|---------------|----------------------|
| **DNS** | `net::ERR_NAME_NOT_RESOLVED` | "Domain not found - check the URL" |
| **SSL** | `net::ERR_CERT_*` | "SSL certificate error - site may be unavailable" |
| **Connection** | `net::ERR_CONNECTION_REFUSED` | "Connection refused - server may be down" |
| **Timeout** | `Timeout`, `exceeded` | "Page took too long to load" |
| **HTTP 4xx** | `404`, `403`, `401` | "Page not found/forbidden/unauthorized" |
| **Invalid URL** | `invalid url`, `protocol` | "Invalid URL format" |

### 3.2 Error Formatter Function

```typescript
interface FormattedError {
  type: 'dns' | 'ssl' | 'connection' | 'timeout' | 'http' | 'url' | 'unknown';
  message: string;
  hint?: string;
}

/**
 * Format a Playwright error into a user-friendly message with actionable hint.
 */
export function formatCaptureError(error: string, deviceName: string): FormattedError {
  const lower = error.toLowerCase();

  // DNS errors
  if (lower.includes('err_name_not_resolved')) {
    return {
      type: 'dns',
      message: `Domain not found`,
      hint: 'Check that the URL is spelled correctly',
    };
  }

  // SSL certificate errors
  if (lower.includes('err_cert_')) {
    return {
      type: 'ssl',
      message: `SSL certificate error`,
      hint: 'The site may have an invalid certificate',
    };
  }

  // Connection errors
  if (lower.includes('err_connection_refused')) {
    return {
      type: 'connection',
      message: `Connection refused`,
      hint: 'The server may be down or blocking requests',
    };
  }

  if (lower.includes('err_connection_timed_out') || lower.includes('err_connection_reset')) {
    return {
      type: 'connection',
      message: `Connection failed`,
      hint: 'Network issue or server unresponsive',
    };
  }

  // Timeout errors
  if (lower.includes('timeout') || lower.includes('exceeded')) {
    return {
      type: 'timeout',
      message: `Page load timed out`,
      hint: 'Page may be slow or have heavy resources',
    };
  }

  // HTTP errors
  if (lower.includes('404')) {
    return {
      type: 'http',
      message: `Page not found (404)`,
      hint: 'Check that the URL path is correct',
    };
  }

  if (lower.includes('403')) {
    return {
      type: 'http',
      message: `Access forbidden (403)`,
      hint: 'The server is blocking access',
    };
  }

  if (lower.includes('401')) {
    return {
      type: 'http',
      message: `Authentication required (401)`,
      hint: 'This page requires login',
    };
  }

  // URL errors
  if (lower.includes('invalid url') || lower.includes('invalid protocol')) {
    return {
      type: 'url',
      message: `Invalid URL`,
      hint: 'URL must start with http:// or https://',
    };
  }

  // Unknown errors
  return {
    type: 'unknown',
    message: error.length > 60 ? error.slice(0, 60) + '...' : error,
    hint: undefined,
  };
}
```

### 3.3 Error Display in CLI

```typescript
import pc from 'picocolors';

function displayError(deviceName: string, error: FormattedError): void {
  const symbol = pc.red('x');
  const device = pc.bold(deviceName);
  const message = error.message;

  console.log(`  ${symbol} ${device}: ${message}`);

  if (error.hint) {
    console.log(pc.dim(`    Hint: ${error.hint}`));
  }
}
```

### 3.4 Final Summary Format

After all captures complete, show a summary:

```typescript
function displaySummary(result: CaptureAllResult): void {
  console.log('');  // blank line

  if (result.failureCount === 0) {
    console.log(pc.green(`  All ${result.successCount} captures succeeded`));
    return;
  }

  // Success/failure counts
  console.log(pc.bold('Summary:'));
  console.log(`  ${pc.green('Succeeded:')} ${result.successCount}`);
  console.log(`  ${pc.red('Failed:')} ${result.failureCount}`);

  // List failures
  const failures = result.results.filter(r => !r.success);
  if (failures.length > 0) {
    console.log('');
    console.log(pc.bold('Failures:'));

    for (const fail of failures) {
      const formatted = formatCaptureError(fail.error ?? 'Unknown', fail.deviceName);
      displayError(fail.deviceName, formatted);
    }
  }
}
```

### 3.5 Exit Codes

Following CLI best practices:

| Exit Code | Meaning | When Used |
|-----------|---------|-----------|
| 0 | Success | All captures succeeded |
| 1 | Partial/general failure | Some captures failed |
| 2 | Argument error | Invalid URL, options |

---

## 4. Integration Architecture

### 4.1 File Structure

```
src/
├── cli/
│   ├── actions.ts      # Add spinner integration
│   ├── progress.ts     # NEW: Progress display utilities
│   └── errors.ts       # NEW: Error formatting utilities
├── engine/
│   └── cookies.ts      # NEW: Cookie banner hiding
└── ...
```

### 4.2 Modified onProgress Signature

The existing `onProgress` callback signature is sufficient:

```typescript
onProgress?: (completed: number, total: number, result: ExecutionResult) => void;
```

No signature change needed. The spinner is managed in the CLI layer, not the engine.

### 4.3 Capture Flow with UX Polish

```typescript
// In actions.ts runCapture()

// 1. Start spinner
const spinner = ora({
  text: `Capturing ${devices.length} devices...`,
  color: 'cyan',
}).start();

// 2. Capture with progress updates
const result = await captureAllDevices(
  manager,
  fullUrl,
  devices,
  {
    ...captureOptions,
    hideCookieBanners: true,  // New option
  },
  {
    concurrency,
    onProgress: (done, total, res) => {
      spinner.text = `Capturing ${done}/${total}: ${res.deviceName}`;
    },
  }
);

// 3. Stop spinner with final status
if (result.failureCount === 0) {
  spinner.succeed(`Captured ${result.successCount} devices`);
} else {
  spinner.warn(`Captured ${result.successCount}/${devices.length} devices`);
}

// 4. Show failure summary (if any)
if (result.failureCount > 0) {
  displayFailureSummary(result.results);
}
```

### 4.4 Cookie Hiding in Capturer

```typescript
// In capturer.ts captureScreenshot()

await page.goto(url, { waitUntil: 'networkidle', timeout: navigationTimeout });

// Inject cookie hiding CSS (optional, controlled by option)
if (options.hideCookieBanners !== false) {
  await hideCookieBanners(page);
}

const buffer = await page.screenshot({ fullPage: true, timeout: screenshotTimeout });
```

---

## 5. Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Terminal spinners | Custom animation loop | ora (installed) | TTY detection, Windows compat, animation timing |
| Progress bars | ASCII art bars | ora with text updates | Simpler, no percentage needed |
| Cookie banner detection | AI-based detector | Static selector list | Good enough for 90%+ of sites |
| Multiple concurrent spinners | Custom spinner manager | N/A (single spinner) | Not needed for our UI |

---

## 6. Common Pitfalls

### 6.1 Spinner + Console.log Interference

**Problem:** Calling `console.log` while spinner is active causes garbled output.

**Solution:** Always stop or update the spinner before logging:
```typescript
spinner.stop();  // or spinner.text = '...'
console.log('message');
spinner.start();
```

### 6.2 Synchronous Operations Blocking Spinner

**Problem:** Spinner animation freezes during sync operations.

**Solution:** All our capture operations are async, so this isn't an issue. But avoid sync loops in the progress callback.

### 6.3 Cookie Banner CSS Not Applied

**Problem:** CSS injection happens too early, before banner is in DOM.

**Solution:** Inject CSS after `waitUntil: 'networkidle'` completes. Most banners are loaded by then.

### 6.4 Non-TTY Environments

**Problem:** Spinner doesn't animate in CI or piped output.

**Solution:** Ora handles this automatically - disables animation but still shows text. No code changes needed.

---

## 7. Summary

### Requirements Coverage

| Requirement | Solution | Confidence |
|-------------|----------|------------|
| UX-01: Progress indicators | Ora spinner with dynamic text | HIGH |
| UX-02: Cookie banner hiding | CSS injection with selector list | HIGH |
| UX-03: Clear error messages | Error categorizer + formatter | HIGH |

### Key Decisions

1. **Use ora (already installed)**: Perfect for spinner + text updates, no new deps
2. **CSS injection for cookies**: Simple, no side effects, good enough coverage
3. **Static selector list**: Covers major CMPs without external dependencies
4. **Error categorization**: Group errors by type, provide actionable hints
5. **Failure summary at end**: Show all failures together, not just inline

### Ready for Planning

This research provides sufficient technical detail to create implementation plans. The approaches are straightforward and build on existing infrastructure.

---

## Sources

### Primary (HIGH confidence)

- [Ora GitHub Repository](https://github.com/sindresorhus/ora) - Official documentation
- [Playwright page.addStyleTag()](https://playwright.dev/docs/api/class-page#page-add-style-tag) - CSS injection API
- [Playwright TimeoutError](https://playwright.dev/docs/api/class-timeouterror) - Error handling
- [Node.js CLI Apps Best Practices](https://github.com/lirantal/nodejs-cli-apps-best-practices) - Error handling guidelines

### Secondary (MEDIUM confidence)

- [I Don't Care About Cookies CSS Selectors](https://gist.github.com/anthonydillon/b77351b8266a777dc5ef8489d5f7df45) - Banner selector patterns
- [Consent-O-Matic Rules](https://github.com/cavi-au/Consent-O-Matic) - CMP detection patterns
- [htmlcsstoimage Cookie Blocking Guide](https://docs.htmlcsstoimage.com/guides/blocking-cookie-banners/) - Selector list
- [Apify Cookie Modal Blocking](https://blog.apify.com/how-to-block-cookie-modals/) - CSS injection approach

### Tertiary (LOW confidence)

- WebSearch results for npm package comparisons
- Community blog posts on CLI spinner patterns

---

## Metadata

**Confidence breakdown:**
- Progress indicators: HIGH - ora is installed, API is well-documented
- Cookie hiding: HIGH - CSS injection is straightforward, selectors are community-tested
- Error messages: HIGH - patterns already exist in codebase, just need formatting layer

**Research date:** 2026-01-20
**Valid until:** 2026-02-20 (30 days - stable libraries)
