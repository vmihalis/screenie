import type { CaptureOptions, ScreenshotResult } from './types.js';
import { DEFAULT_TIMEOUT } from './types.js';
import { BrowserManager } from './browser.js';

/**
 * Capture a full-page screenshot of a URL using a specific device configuration.
 *
 * Uses the provided BrowserManager to create an isolated context for the device,
 * navigates to the URL, waits for network idle, and captures the full page.
 *
 * @param manager - BrowserManager instance (allows reuse across captures)
 * @param options - Capture options including URL, device, and timeout
 * @returns ScreenshotResult with buffer on success or error message on failure
 *
 * Requirements satisfied:
 * - SHOT-01: Full-page screenshot (captures entire scrollable content)
 * - LOAD-01: Network idle wait before capture
 * - LOAD-04: 30s timeout (split: 80% navigation, 20% screenshot)
 */
export async function captureScreenshot(
  manager: BrowserManager,
  options: CaptureOptions
): Promise<ScreenshotResult> {
  const { url, device, timeout = DEFAULT_TIMEOUT } = options;

  // Split timeout budget: 80% navigation, 20% screenshot
  const navigationTimeout = Math.floor(timeout * 0.8);
  const screenshotTimeout = Math.floor(timeout * 0.2);

  const context = await manager.createContext(device);

  try {
    const page = await context.newPage();

    // Navigate with network idle wait (LOAD-01)
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: navigationTimeout,
    });

    // Capture full-page screenshot (SHOT-01)
    const buffer = await page.screenshot({
      fullPage: true,
      type: 'png',
      scale: 'css', // Consistent file sizes across DPRs
      timeout: screenshotTimeout,
    });

    return {
      success: true,
      deviceName: device.name,
      buffer,
    };
  } catch (error) {
    // Return error result instead of throwing
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      deviceName: device.name,
      error: message,
    };
  } finally {
    // Always close context to prevent resource leaks
    await manager.closeContext(context);
  }
}
