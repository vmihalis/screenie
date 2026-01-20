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

/**
 * CSS styles for the HTML report
 * Includes reset, layout, thumbnail grid, and lightbox styles
 */
const CSS_STYLES = `
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
  color: #333;
  line-height: 1.5;
}

.report-header {
  background: #fff;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.report-header h1 {
  margin-bottom: 1rem;
}

.metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 2rem;
}

.metadata p {
  margin: 0;
}

.category-section {
  background: #fff;
  margin: 0 1rem 2rem;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.category-section h2 {
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #eee;
}

.thumbnail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.thumbnail-card {
  background: #fafafa;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #eee;
}

.thumbnail-link {
  display: block;
  aspect-ratio: 16 / 10;
  overflow: hidden;
}

.thumbnail-link img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top;
  transition: transform 0.2s;
}

.thumbnail-link:hover img {
  transform: scale(1.02);
}

.thumbnail-info {
  padding: 0.75rem;
  font-size: 0.875rem;
}

.thumbnail-info .device-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.thumbnail-info .dimensions {
  color: #666;
}

/* Lightbox styles */
.lightbox {
  display: none;
  position: fixed;
  z-index: 9999;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.95);
}

.lightbox:target {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.lightbox-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  color: #fff;
  font-size: 2rem;
  text-decoration: none;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
}

.lightbox-close:hover {
  background: rgba(255,255,255,0.2);
}

.lightbox img {
  max-width: 95vw;
  max-height: 85vh;
  object-fit: contain;
}

.lightbox-info {
  color: #fff;
  margin-top: 1rem;
  text-align: center;
}
`;

/**
 * Render the report header with metadata
 */
function renderHeader(data: ReportData): string {
  return `<header class="report-header">
    <h1>Responsive Screenshots</h1>
    <div class="metadata">
      <p><strong>URL:</strong> ${escapeHtml(data.url)}</p>
      <p><strong>Captured:</strong> ${data.capturedAt}</p>
      <p><strong>Duration:</strong> ${formatDuration(data.duration)}</p>
      <p><strong>Devices:</strong> ${data.deviceCount}</p>
    </div>
  </header>`;
}

/**
 * Render a single thumbnail card
 */
function renderThumbnailCard(screenshot: ScreenshotForReport): string {
  const lightboxId = generateLightboxId(
    screenshot.deviceName,
    screenshot.width,
    screenshot.height
  );

  return `<div class="thumbnail-card">
    <a href="#${lightboxId}" class="thumbnail-link">
      <img src="${screenshot.dataUri}" alt="${escapeHtml(screenshot.deviceName)}">
    </a>
    <div class="thumbnail-info">
      <div class="device-name">${escapeHtml(screenshot.deviceName)}</div>
      <div class="dimensions">${screenshot.width} x ${screenshot.height}</div>
    </div>
  </div>`;
}

/**
 * Render a category section with all its thumbnails
 */
function renderCategory(
  category: DeviceCategory,
  screenshots: ScreenshotForReport[]
): string {
  const displayName = getCategoryDisplayName(category);
  const thumbnails = screenshots.map(renderThumbnailCard).join('\n    ');

  return `<section class="category-section">
    <h2>${displayName}</h2>
    <div class="thumbnail-grid">
    ${thumbnails}
    </div>
  </section>`;
}

/**
 * Render a lightbox for a single screenshot
 */
function renderLightbox(screenshot: ScreenshotForReport): string {
  const lightboxId = generateLightboxId(
    screenshot.deviceName,
    screenshot.width,
    screenshot.height
  );

  return `<a href="#_" class="lightbox" id="${lightboxId}">
    <span class="lightbox-close">&times;</span>
    <img src="${screenshot.dataUri}" alt="${escapeHtml(screenshot.deviceName)} - Full Size">
    <div class="lightbox-info">
      <strong>${escapeHtml(screenshot.deviceName)}</strong> - ${screenshot.width} x ${screenshot.height}
    </div>
  </a>`;
}

/**
 * Build complete HTML report from data and screenshots
 */
function buildReportHtml(
  data: ReportData,
  screenshots: ScreenshotForReport[]
): string {
  const grouped = groupByCategory(screenshots);

  // Render categories in fixed order: phones, tablets, pc-laptops
  const categoryOrder: DeviceCategory[] = ['phones', 'tablets', 'pc-laptops'];
  const categorySections: string[] = [];

  for (const category of categoryOrder) {
    const categoryScreenshots = grouped.get(category);
    if (categoryScreenshots && categoryScreenshots.length > 0) {
      categorySections.push(renderCategory(category, categoryScreenshots));
    }
  }

  // Render all lightboxes
  const lightboxes = screenshots.map(renderLightbox).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Screenshots - ${escapeHtml(data.url)}</title>
  <style>${CSS_STYLES}</style>
</head>
<body>
  ${renderHeader(data)}
  <main>
    ${categorySections.join('\n    ')}
  </main>
  ${lightboxes}
</body>
</html>`;
}

// Placeholder for generateReport function (Task 4)

export async function generateReport(
  _data: ReportData,
  _screenshots: ScreenshotForReport[],
  _outputPath: string
): Promise<string> {
  // Will be implemented in Task 4
  return _outputPath;
}
