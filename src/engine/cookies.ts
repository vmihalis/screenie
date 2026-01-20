import type { Page } from 'playwright';

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
] as const;

/**
 * Build CSS rule to hide elements matching selectors.
 * Uses aggressive hiding: display:none + visibility:hidden + opacity:0
 */
function buildCookieHideCSS(selectors: readonly string[]): string {
  return `${selectors.join(',\n')} {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
}`;
}

/**
 * Hide common cookie consent banners on a page via CSS injection.
 * Should be called after page.goto() completes for reliable timing.
 *
 * @param page - Playwright Page instance
 *
 * @example
 * await page.goto(url, { waitUntil: 'networkidle' });
 * await hideCookieBanners(page);
 * const screenshot = await page.screenshot({ fullPage: true });
 */
export async function hideCookieBanners(page: Page): Promise<void> {
  const css = buildCookieHideCSS(COOKIE_BANNER_SELECTORS);
  await page.addStyleTag({ content: css });
}
