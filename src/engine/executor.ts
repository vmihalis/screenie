import pLimit from 'p-limit';
import type { BrowserManager } from './browser.js';
import { captureScreenshot } from './capturer.js';
import type { Device } from '../devices/types.js';
import type {
  CaptureOptions,
  ExecutionOptions,
  ExecutionResult,
  CaptureAllResult,
} from './types.js';

/**
 * Error patterns that should NOT trigger retry.
 * These represent permanent failures that won't succeed on retry.
 */
const NON_RETRYABLE_PATTERNS = [
  'net::ERR_NAME_NOT_RESOLVED', // DNS failure
  'net::ERR_CERT_', // SSL/certificate errors
  'invalid url', // Malformed URL
  '404', // Page not found
  '403', // Forbidden
  '401', // Unauthorized
];

/**
 * Check if an error is retryable (transient) vs permanent.
 *
 * @param error - Error message string from capture attempt
 * @returns true if the error is retryable, false if permanent
 *
 * @example
 * isRetryableError('timeout') // true - might work on retry
 * isRetryableError('net::ERR_NAME_NOT_RESOLVED') // false - DNS won't resolve
 */
export function isRetryableError(error?: string): boolean {
  if (!error) return false;
  const lowerError = error.toLowerCase();
  return !NON_RETRYABLE_PATTERNS.some((pattern) =>
    lowerError.includes(pattern.toLowerCase())
  );
}

/**
 * Delay helper for retry backoff
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Capture screenshot with automatic retry on transient failures.
 *
 * @param manager - BrowserManager instance
 * @param options - Capture options including URL, device, timeout
 * @param maxRetries - Maximum attempts before giving up (default: 3)
 * @param retryDelay - Milliseconds to wait between retries (default: 500)
 * @returns ExecutionResult with attempts count
 *
 * Requirements satisfied:
 * - SHOT-04: Retry 2-3 times on transient failures
 * - Non-retryable errors (DNS, 404) fail immediately
 */
export async function captureWithRetry(
  manager: BrowserManager,
  options: CaptureOptions,
  maxRetries: number = 3,
  retryDelay: number = 500
): Promise<ExecutionResult> {
  let lastResult: ExecutionResult | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await captureScreenshot(manager, options);

    // Convert ScreenshotResult to ExecutionResult with attempts
    lastResult = { ...result, attempts: attempt };

    if (result.success) {
      return lastResult;
    }

    // Don't retry non-transient errors or on last attempt
    if (!isRetryableError(result.error) || attempt === maxRetries) {
      break;
    }

    // Brief delay before retry
    await delay(retryDelay);
  }

  // lastResult is always defined because we run at least one attempt
  return lastResult!;
}

/**
 * Capture screenshots for all devices in parallel with retry logic.
 *
 * Uses p-limit for concurrency control to prevent memory exhaustion.
 * Uses Promise.allSettled to collect all results even with partial failures.
 *
 * @param manager - BrowserManager instance (shared across all captures)
 * @param url - URL to capture
 * @param devices - Array of devices to capture
 * @param captureOptions - Options for each capture (timeout, waitBuffer, etc.)
 * @param executionOptions - Parallel execution options (concurrency, retries)
 * @returns CaptureAllResult with all individual results and aggregate counts
 *
 * Requirements satisfied:
 * - SHOT-02: Capture multiple devices with configurable concurrency
 * - SHOT-04: Retry 2-3 times on transient failures
 * - All results collected even with partial failures
 *
 * @example
 * const manager = new BrowserManager();
 * await manager.launch();
 *
 * const result = await captureAllDevices(
 *   manager,
 *   'https://example.com',
 *   devices,
 *   { timeout: 30000, waitBuffer: 500 },
 *   { concurrency: 10, maxRetries: 3 }
 * );
 *
 * console.log(`${result.successCount}/${result.results.length} succeeded`);
 */
export async function captureAllDevices(
  manager: BrowserManager,
  url: string,
  devices: Device[],
  captureOptions: Omit<CaptureOptions, 'url' | 'device'>,
  executionOptions: ExecutionOptions = {}
): Promise<CaptureAllResult> {
  const {
    concurrency = 10,
    maxRetries = 3,
    retryDelay = 500,
    onProgress,
  } = executionOptions;

  const limit = pLimit(concurrency);
  let completedCount = 0;

  // Create concurrency-limited tasks
  const tasks = devices.map((device) =>
    limit(async () => {
      const result = await captureWithRetry(
        manager,
        { ...captureOptions, url, device },
        maxRetries,
        retryDelay
      );

      // Track progress and notify callback
      completedCount++;
      onProgress?.(completedCount, devices.length, result);

      return result;
    })
  );

  // Execute all tasks, collecting results even on failures
  const settled = await Promise.allSettled(tasks);

  // Process results
  const results: ExecutionResult[] = [];
  let successCount = 0;
  let failureCount = 0;
  let totalAttempts = 0;

  for (const [i, settledResult] of settled.entries()) {
    if (settledResult.status === 'fulfilled') {
      results.push(settledResult.value);
      totalAttempts += settledResult.value.attempts;

      if (settledResult.value.success) {
        successCount++;
      } else {
        failureCount++;
      }
    } else {
      // Promise rejected (unexpected - our function returns errors)
      const device = devices[i];
      const reason = settledResult.reason as Error | undefined;
      results.push({
        success: false,
        deviceName: device?.name ?? 'unknown',
        error: reason?.message ?? 'Unknown error',
        attempts: 1,
      });
      failureCount++;
      totalAttempts++;
    }
  }

  return {
    results,
    successCount,
    failureCount,
    totalAttempts,
  };
}
