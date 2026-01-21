import type { DeviceCategory } from '../devices/types.js';

export interface OutputOptions {
  baseDir: string;
  timestamp: string;
}

export interface FileInfo {
  deviceName: string;
  category: DeviceCategory;
  filename: string;
  filepath: string;
}

export interface ReportData {
  url: string;
  capturedAt: string;
  duration: number;
  deviceCount: number;
  files: FileInfo[];
}

/**
 * Options for creating output directory
 */
export interface CreateOutputOptions {
  /** Base directory (default: './screenshots') */
  baseDir?: string;
  /** Override timestamp for testing (default: auto-generated) */
  timestamp?: string;
}

/**
 * Result of saving a single screenshot
 */
export interface SaveResult {
  success: boolean;
  /** Full path where file was saved */
  filepath?: string;
  /** Error message if save failed */
  error?: string;
  /** Device name for reference */
  deviceName: string;
}

/**
 * Result of saving all screenshots from a capture run
 */
export interface SaveAllResult {
  /** Individual save results */
  results: SaveResult[];
  /** Output directory path */
  outputDir: string;
  /** Count of successfully saved files */
  savedCount: number;
  /** Count of files that failed to save */
  failedCount: number;
}

/**
 * Screenshot data prepared for HTML report generation
 */
export interface ScreenshotForReport {
  /** Device display name */
  deviceName: string;
  /** Device category for grouping */
  category: DeviceCategory;
  /** Viewport width */
  width: number;
  /** Viewport height (the fold position) */
  height: number;
  /** Base64 data URI (data:image/png;base64,...) */
  dataUri: string;
  /** Actual screenshot width in pixels */
  screenshotWidth: number;
  /** Actual screenshot height in pixels (full-page height) */
  screenshotHeight: number;
  /** Fold position for lightbox (percentage of screenshot height) */
  foldPositionLightbox: number;
  /** Fold position for thumbnail (percentage of visible area, or null if not visible) */
  foldPositionThumbnail: number | null;
}
