import type { Device } from '../devices/types.js';

export interface CaptureOptions {
  url: string;
  device: Device;
  timeout: number;
  waitBuffer: number;
}

export interface ScreenshotResult {
  success: boolean;
  deviceName: string;
  buffer?: Buffer;
  error?: string;
}
