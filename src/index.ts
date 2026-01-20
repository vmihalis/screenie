// Main library entry point for responsive-capture

// Re-export types
export type { CaptureResult } from './types/index.js';

// Re-export device types and functions
export type { Device, DeviceCategory } from './devices/index.js';
export { getDevices, getDevicesByCategory } from './devices/index.js';

// Re-export config
export type { Config } from './config/index.js';
export { defaultConfig } from './config/index.js';

// Re-export engine
export type { CaptureOptions, ScreenshotResult } from './engine/index.js';
export { BrowserManager, captureScreenshot } from './engine/index.js';

// Re-export output
export type { OutputOptions, FileInfo, ReportData } from './output/index.js';
export { organizeFiles, generateFilename, generateReport } from './output/index.js';
