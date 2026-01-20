import type { CaptureOptions, ScreenshotResult } from './types.js';

// Screenshot capturer - placeholder for Phase 3
export async function captureScreenshot(
  _options: CaptureOptions
): Promise<ScreenshotResult> {
  return {
    success: false,
    deviceName: _options.device.name,
    error: 'Not implemented',
  };
}
