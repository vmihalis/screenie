import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ReportData, ScreenshotForReport } from './types.js';
import type { DeviceCategory, Device } from '../devices/types.js';
import type { ExecutionResult } from '../engine/types.js';

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Convert Buffer to base64 data URI for embedding in HTML
 */
export function bufferToDataUri(buffer: Buffer): string {
  const base64 = buffer.toString('base64');
  return `data:image/png;base64,${base64}`;
}

/**
 * Format milliseconds to human readable duration
 */
export function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Generate unique HTML-safe ID for lightbox anchor
 */
export function generateLightboxId(
  deviceName: string,
  width: number,
  height: number
): string {
  const safeName = deviceName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `lb-${safeName}-${width}x${height}`;
}

/**
 * Group screenshots by device category
 */
export function groupByCategory(
  screenshots: ScreenshotForReport[]
): Map<DeviceCategory, ScreenshotForReport[]> {
  const grouped = new Map<DeviceCategory, ScreenshotForReport[]>();

  for (const screenshot of screenshots) {
    const existing = grouped.get(screenshot.category) ?? [];
    existing.push(screenshot);
    grouped.set(screenshot.category, existing);
  }

  return grouped;
}

/**
 * Get human-readable display name for device category
 */
export function getCategoryDisplayName(category: DeviceCategory): string {
  const names: Record<DeviceCategory, string> = {
    phones: 'Phones',
    tablets: 'Tablets',
    'pc-laptops': 'Desktop & Laptops',
  };
  return names[category];
}

// Placeholder for CSS_STYLES and render functions (Task 3)
// Placeholder for generateReport function (Task 4)

export async function generateReport(
  _data: ReportData,
  _screenshots: ScreenshotForReport[],
  _outputPath: string
): Promise<string> {
  // Will be implemented in Task 4
  return _outputPath;
}
