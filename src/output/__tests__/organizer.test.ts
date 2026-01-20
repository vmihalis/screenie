import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rm, readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import {
  generateTimestamp,
  generateFilename,
  createOutputDirectory,
  writeScreenshot,
  saveAllScreenshots,
} from '../organizer.js';
import type { ExecutionResult } from '../../engine/types.js';
import type { Device } from '../../devices/types.js';

// Test directory for file operations
const TEST_BASE_DIR = join(process.cwd(), '.test-output');

describe('generateTimestamp', () => {
  it('returns string in YYYY-MM-DD-HHmmss format', () => {
    const timestamp = generateTimestamp();
    // Format: 2026-01-20-143025
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}-\d{6}$/);
  });

  it('does not contain colons (Windows-safe)', () => {
    const timestamp = generateTimestamp();
    expect(timestamp).not.toContain(':');
  });

  it('does not contain T or Z from ISO format', () => {
    const timestamp = generateTimestamp();
    expect(timestamp).not.toContain('T');
    expect(timestamp).not.toContain('Z');
  });

  it('two calls close together produce same or incremented timestamp', () => {
    const first = generateTimestamp();
    const second = generateTimestamp();
    // Should be same or second >= first (lexicographic order works for this format)
    expect(second >= first).toBe(true);
  });
});

describe('generateFilename', () => {
  it('converts device name to lowercase with dimensions', () => {
    const filename = generateFilename('iPhone 14 Pro', 393, 852);
    expect(filename).toBe('iphone-14-pro-393x852.png');
  });

  it('handles special characters by replacing with hyphens', () => {
    const filename = generateFilename('MacBook Pro 16"', 1728, 1117);
    expect(filename).toBe('macbook-pro-16-1728x1117.png');
  });

  it('collapses multiple spaces to single hyphen', () => {
    const filename = generateFilename('Samsung  Galaxy   S23', 360, 780);
    expect(filename).toBe('samsung-galaxy-s23-360x780.png');
  });

  it('trims leading and trailing spaces', () => {
    const filename = generateFilename(' Test Device ', 100, 100);
    expect(filename).toBe('test-device-100x100.png');
  });

  it('preserves numbers in device name', () => {
    const filename = generateFilename('Pixel 8 Pro', 412, 915);
    expect(filename).toBe('pixel-8-pro-412x915.png');
  });

  it('returns .png extension always', () => {
    const filename = generateFilename('Any Device', 100, 200);
    expect(filename).toMatch(/\.png$/);
  });

  it('handles device names starting with numbers', () => {
    const filename = generateFilename('3G Phone Classic', 320, 480);
    expect(filename).toBe('3g-phone-classic-320x480.png');
  });

  it('removes leading/trailing hyphens from special char names', () => {
    const filename = generateFilename('***Special***', 100, 200);
    expect(filename).toBe('special-100x200.png');
  });
});
